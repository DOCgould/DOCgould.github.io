// Lazy-loaded v86 integration. On first `qemu` invocation:
//   1. dynamic-imports v86 as an ES module from jsDelivr (CORS-clean).
//   2. boots a small, same-origin Linux CD-ROM (~7.4 MB under assets/v86/)
//      — no third-party CORS in the boot path.
//   3. streams v86's own download-progress events into the modal status.
//   4. watches VGA text-mode output for a shell prompt, then types a
//      welcome script that prints Christian's bio through the guest's
//      own /bin/sh + coreutils. An 18 s timeout fallback also fires the
//      injection if prompt detection misses.
//
// v86@0.3.1 is an ES module exporting V86Starter. In that version, the
// relevant APIs used here are:
//   new V86Starter({ ... })          — constructor
//   emulator.add_listener("download-progress", cb)   — {file_index, loaded, total, file_name}
//   emulator.add_listener("emulator-ready", cb)
//   emulator.add_listener("screen-put-char", cb)      — (row, col, char_code, fg, bg)
//   emulator.keyboard_send_text(string)               — sends a text string to the guest
//   emulator.destroy()                                — teardown
// Graceful kernel-panic ASCII + DEGRADED status on any failure.

import { compactFacts, identity } from "./resume-data.js";

const V86_VER = "0.3.1";
const V86_CDN = `https://cdn.jsdelivr.net/npm/v86@${V86_VER}`;
const V86_MODULE_URL = `${V86_CDN}/build/index.js`;
const V86_WASM_URL  = `${V86_CDN}/build/v86.wasm`;
const SEABIOS_URL   = `${V86_CDN}/bios/seabios.bin`;
const VGABIOS_URL   = `${V86_CDN}/bios/vgabios.bin`;
// Resolve against the module's URL so the ISO loads correctly whether this
// module is imported from /index.html or /terminal/index.html.
const LINUX_ISO_URL = new URL("./v86/linux.iso", import.meta.url).href;

// VGA text-mode default is 80x25. We track the visible buffer as an
// array-of-rows so we can regex-match the bottom rows for a prompt.
const TEXT_COLS = 80;
const TEXT_ROWS = 25;

let modalEl = null;
let emulator = null;
let V86StarterRef = null;

async function ensureV86Module() {
  if (V86StarterRef) return V86StarterRef;
  const mod = await import(/* @vite-ignore */ V86_MODULE_URL);
  V86StarterRef = mod.V86Starter || mod.default?.V86Starter;
  if (!V86StarterRef) throw new Error("V86Starter export not found");
  return V86StarterRef;
}

function mountModal() {
  if (modalEl) { modalEl.style.display = "flex"; return modalEl; }
  modalEl = document.createElement("div");
  modalEl.className = "v86-modal";
  modalEl.innerHTML = `
    <div class="v86-frame">
      <div class="v86-titlebar">
        <span class="v86-title">INNOFLIGHT CFC-STAGING :: QEMU FALLBACK :: linux</span>
        <button class="v86-close" type="button" aria-label="close">[ X ]</button>
      </div>
      <div class="v86-status" data-v86-status>boot pending...</div>
      <div class="v86-screen" data-v86-screen></div>
      <pre class="v86-serial" data-v86-serial tabindex="0"></pre>
      <div class="v86-footnote">
        real Linux running in WebAssembly via v86. click the serial pane and type to interact. Esc to close.
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);
  const close = () => {
    modalEl.style.display = "none";
    try { emulator?.destroy?.(); } catch {}
    emulator = null;
  };
  modalEl.querySelector(".v86-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.style.display !== "none") close();
  });
  return modalEl;
}

function setStatus(text) {
  const el = modalEl?.querySelector("[data-v86-status]");
  if (el) el.textContent = text;
}

function kernelPanic() {
  const inner = modalEl.querySelector("[data-v86-screen]");
  inner.innerHTML = `<pre>
[   42.000000] Kernel panic - not syncing: v86 bootstrap failed.
[   42.013200] CPU: 0 PID: 1 Comm: swapper Tainted: G    O    6.1.0-yocto-standard
[   42.013201] Hardware name: v86 virtual / CFC-STAGING, BIOS SeaBIOS
[   42.013202] Call Trace:
[   42.013203]  &lt;TASK&gt;
[   42.013204]  panic+0x10d/0x2f1
[   42.013205]  mount_block_root.cold+0x6a/0x6a
[   42.013206]  prepare_namespace+0x13a/0x175
[   42.013207]  ? rest_init+0xd0/0xd0
[   42.013208]  kernel_init+0x19/0x130
[   42.013209]  ret_from_fork+0x1f/0x30
[   42.013210]  &lt;/TASK&gt;

---[ end Kernel panic - v86 bootstrap failed ]---

The real hardware is fine; the emulator's bootstrap just tripped.
Everything else on this site is unaffected. Close this modal and keep
poking the shell.
</pre>`;
  setStatus("STATUS :: DEGRADED — v86 bootstrap");
  const hostStatus = document.querySelector("[data-status]");
  if (hostStatus) { hostStatus.textContent = "STATUS :: DEGRADED — v86"; hostStatus.dataset.state = "degraded"; }
}

function buildWelcomeScript() {
  const facts = compactFacts.map(f => " - " + f.replace(/'/g, "'\\''")).join("\n");
  return [
    "",
    "clear",
    "cat <<'__EOF__'",
    "",
    "  ===========================================================",
    "   INNOFLIGHT CFC-STAGING  ::  linux guest",
    "  ===========================================================",
    "",
    "  real Linux kernel running in WebAssembly. the text below was",
    "  cat'd through this guest's own coreutils:",
    "",
    `  identity ....... ${identity.name}`,
    `  mail ........... ${identity.email}`,
    `  pitch .......... ${identity.pitch}`,
    "",
    "  resume-highlights --",
    facts,
    "",
    "  try:  uname -a ; cat /proc/cpuinfo ; ls /bin",
    "  the host page keeps running. close this modal anytime (Esc).",
    "",
    "__EOF__",
    "echo",
    "echo '--- dmesg (last 40) ---'",
    "dmesg 2>/dev/null | tail -n 40 || echo '(dmesg unavailable)'",
    "echo '--- end dmesg ---'",
    "",
  ].join("\n");
}

// opts.headless: true skips modal mount; caller handles serial I/O via opts.onSerialChar.
// Returns the emulator instance in either mode (null on failure).
export async function bootV86(hostTerm, opts = {}) {
  const headless = !!opts.headless;
  if (!headless) mountModal();
  setStatus("fetching v86 module from jsDelivr...");
  let V86Starter;
  try {
    V86Starter = await ensureV86Module();
  } catch (e) {
    console.warn("v86 module import failed", e);
    hostTerm.print("[qemu] failed to load v86 module\n\n");
    if (!headless) kernelPanic();
    return null;
  }

  // v86 requires a screen_container even when we don't render VGA. In headless
  // mode, give it an off-DOM stub so the ctor is happy.
  let screenContainer;
  if (headless) {
    screenContainer = document.createElement("div");
    screenContainer.innerHTML = `<div></div><canvas></canvas>`;
  } else {
    screenContainer = modalEl.querySelector("[data-v86-screen]");
    screenContainer.innerHTML = `
      <div style="white-space: pre; font-family: VT323, 'IBM Plex Mono', monospace; line-height: 1.05; color: #c4ffc4; font-size: 15px;"></div>
      <canvas style="display:none"></canvas>
    `;
  }

  setStatus("initializing V86Starter...");
  hostTerm.print(`[qemu] booting ${LINUX_ISO_URL}\n`);
  if (!headless) hostTerm.print("[qemu] see modal window for guest tty\n\n");

  try {
    emulator = new V86Starter({
      wasm_path: V86_WASM_URL,
      memory_size: 64 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      screen_container: screenContainer,
      bios:     { url: SEABIOS_URL },
      vga_bios: { url: VGABIOS_URL },
      // async: false loads the whole ISO up front (one fetch, no Range
      // needed). 7.4 MB is acceptable, and this works on any static host
      // including python's SimpleHTTPServer. With async: true, v86 probes
      // for Range support and hard-fails if the server doesn't offer it.
      cdrom:    { url: LINUX_ISO_URL, async: false },
      autostart: true,
    });
  } catch (e) {
    console.warn("V86Starter ctor failed", e);
    if (!headless) kernelPanic();
    return null;
  }
  // Download progress — v86 emits this per file being fetched.
  const progress = { bytes: 0, total: 0, file: "" };
  try {
    emulator.add_listener("download-progress", (e) => {
      const name = e?.file_name || "";
      const short = name.split("/").pop() || "asset";
      if (short !== progress.file) { progress.file = short; }
      const mb = (x) => (x / (1024 * 1024)).toFixed(1);
      if (e?.total) {
        setStatus(`downloading ${short} — ${mb(e.loaded)} / ${mb(e.total)} MB`);
      } else if (e?.loaded) {
        setStatus(`downloading ${short} — ${mb(e.loaded)} MB`);
      }
    });
  } catch {}

  let emulatorReady = false;
  emulator.add_listener("emulator-ready", () => {
    emulatorReady = true;
    setStatus("kernel booting (watch the guest screen)...");
  });

  // VGA-row watcher. Maintain a small buffer of the last-written rows by
  // accumulating screen-put-char events, then regex the bottom rows for
  // a shell prompt. Also track "screen settled" (no writes for N ms) as
  // a secondary signal — when the kernel stops printing, the shell is
  // almost certainly ready.
  const buffer = Array.from({ length: TEXT_ROWS }, () => new Array(TEXT_COLS).fill(" "));
  let injected = false;
  let lastPutCharAt = 0;
  let charCount = 0;
  let settleCheckTimer = null;
  // Don't declare "settled" until the screen has actually been busy —
  // otherwise we trip on the decompression pause between BIOS and kernel.
  const MIN_CHARS_BEFORE_SETTLE = 1500;

  const tryInject = (reason) => {
    if (injected || !emulator) return;
    if (reason === "last-resort timeout" && !emulatorReady) return;
    injected = true;
    setStatus("STATUS :: guest shell online, injecting bio... (" + reason + ")");
    const script = buildWelcomeScript();
    try {
      // Prefer serial0_send: linux4.iso has `console=ttyS0` so the shell
      // reads from serial, not the PC keyboard. serial0_send pushes the
      // text directly at the guest's /dev/ttyS0 input.
      if (typeof emulator.serial0_send === "function") {
        emulator.serial0_send(script);
      } else if (typeof emulator.keyboard_send_text === "function") {
        emulator.keyboard_send_text(script);
      } else {
        console.warn("no keystroke-sending method available on emulator");
      }
    } catch (e) { console.warn("inject failed", e); }
  };

  // A shell prompt is a short line that *ends* in "# " or "$ " with
  // only username/hostname/path-ish chars before it. Avoids matching
  // mid-boot kernel text that happens to contain "#" or "$".
  const promptRe = /^[\w~\/@:.\-]{0,30}\s*[#$]\s*$/;
  // Serial output — linux4.iso boots with console=ttyS0, so userspace
  // writes (login prompt, shell prompt) come out here, not to VGA text.
  let serialBuf = "";
  let serialLastAt = 0;
  let serialCount = 0;
  // Serial pane: userspace (shell, injected bio) prints here, not VGA.
  // In headless mode there is no modal, so the pane is null and appendSerial no-ops.
  const serialPane = headless ? null : modalEl.querySelector("[data-v86-serial]");
  const appendSerial = (s) => {
    if (!serialPane) return;
    for (const c of s) {
      if (c === "\b" || c.charCodeAt(0) === 0x7f) {
        serialPane.textContent = serialPane.textContent.slice(0, -1);
      } else if (c === "\r") {
        // carriage return — swallow; the following \n will do the line break
      } else {
        serialPane.textContent += c;
      }
    }
    // Cap buffer so the DOM node doesn't grow unbounded.
    if (serialPane.textContent.length > 16384) {
      serialPane.textContent = serialPane.textContent.slice(-8192);
    }
    serialPane.scrollTop = serialPane.scrollHeight;
  };
  // Forward keystrokes typed into the serial pane straight to the guest ttyS0.
  if (serialPane) {
    serialPane.addEventListener("keydown", (e) => {
      if (!emulator || typeof emulator.serial0_send !== "function") return;
      let s = null;
      if (e.key === "Enter") s = "\n";
      else if (e.key === "Backspace") s = "\x7f";
      else if (e.key === "Tab") s = "\t";
      else if (e.key === "Escape") return; // let modal Esc close propagate
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) s = e.key;
      else if (e.ctrlKey && e.key.length === 1) {
        const code = e.key.toUpperCase().charCodeAt(0) - 64;
        if (code > 0 && code < 32) s = String.fromCharCode(code);
      }
      if (s !== null) { e.preventDefault(); emulator.serial0_send(s); }
    });
  }
  emulator.add_listener("serial0-output-char", (ch) => {
    const s = typeof ch === "string" ? ch : String.fromCharCode(ch);
    serialBuf += s;
    if (serialBuf.length > 4096) serialBuf = serialBuf.slice(-2048);
    serialLastAt = Date.now();
    serialCount++;
    appendSerial(s);
    if (typeof opts.onSerialChar === "function") {
      try { opts.onSerialChar(s); } catch (e) { /* swallow */ }
    }
    if (!injected) {
      // Accept a variety of userspace prompt shapes observed across v86
      // guest images: `~%`, `/ #`, `# `, `$ `, `login:`, `[...]# `.
      const tail = serialBuf.slice(-40);
      if (/~\s*%\s*$/.test(tail)
          || /\/\s*#\s*$/.test(tail)
          || /[\w~\-/]\s+[#$%]\s*$/.test(tail)
          || /(^|\n)\s*[#$%]\s*$/.test(tail)
          || /login:\s*$/i.test(tail)) {
        tryInject("serial prompt");
      }
    }
  });

  emulator.add_listener("screen-put-char", (evt) => {
    // evt may be an array [row, col, ch, fg, bg] or an object depending on version.
    let row, col, ch;
    if (Array.isArray(evt)) { [row, col, ch] = evt; }
    else { row = evt?.row; col = evt?.col; ch = evt?.char_code ?? evt?.chr; }
    if (row == null || col == null || ch == null) return;
    if (row < 0 || row >= TEXT_ROWS || col < 0 || col >= TEXT_COLS) return;
    buffer[row][col] = String.fromCharCode(ch);
    lastPutCharAt = Date.now();
    charCount++;
    if (!injected) {
      for (let r = TEXT_ROWS - 1; r >= Math.max(0, TEXT_ROWS - 6); r--) {
        const line = buffer[r].join("").trimEnd();
        if (line && promptRe.test(line)) { tryInject("prompt detected"); return; }
      }
    }
  });

  // Screen-settled detector: if screen hasn't changed for 4 s and v86 is
  // ready, the kernel is probably at a prompt. Much more reliable than a
  // fixed wall-clock timeout for images whose boot wall-time varies.
  settleCheckTimer = setInterval(() => {
    if (injected) { clearInterval(settleCheckTimer); return; }
    if (!emulatorReady) return;
    // Prefer serial settle — serial is where userspace talks on this
    // image. Only fall back to VGA settle if no serial output at all.
    // Serial settled: 10 s of silence after >=200 chars seen. Generous
    // because real-browser boots take ~15 s; slow headless may take 60+.
    if (serialCount > 200 && serialLastAt > 0 && Date.now() - serialLastAt >= 10000) {
      clearInterval(settleCheckTimer);
      tryInject("serial settled");
      return;
    }
    // No serial at all: this image uses VGA-only console.
    if (serialCount === 0 && charCount >= MIN_CHARS_BEFORE_SETTLE
        && lastPutCharAt > 0 && Date.now() - lastPutCharAt >= 8000) {
      clearInterval(settleCheckTimer);
      tryInject("vga settled (no serial)");
    }
  }, 1000);

  // Last-resort wall-clock fallback at 90 s, only if emulator-ready fired.
  setTimeout(() => tryInject("last-resort timeout"), 90000);
  setTimeout(() => {
    if (!injected) setStatus("STATUS :: still booting (kernel init takes a while)...");
  }, 10000);

  return emulator;
}
