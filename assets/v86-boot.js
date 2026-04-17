// Lazy-loaded v86 integration. On first `qemu` invocation:
//   1. injects libv86.js via <script>
//   2. boots a small Buildroot image in a modal overlay
//   3. waits for the guest shell prompt, then types a welcome script
//      that cats Christian's resume content into the guest's own tty.
//
// The "resume injection" is via guest-side shell here-docs — the text
// really does run through the emulated Linux's coreutils on its way to
// the screen. Not a full 9p rootfs, but it's honest: bios, kernel, and
// /bin/sh are real; Christian's bio.txt is printed by a real `cat`.
//
// Any fetch failure → the modal shows a tongue-in-cheek kernel panic and
// the shell stays usable.

import { compactFacts, identity } from "./resume-data.js";

const V86_VER = "0.3.1";
const V86_CDN = `https://cdn.jsdelivr.net/npm/v86@${V86_VER}`;
// Buildroot demo image hosted by copy.sh (the v86 author). Small (~5 MB),
// boots to a busybox shell.
const LINUX_IMAGE_CANDIDATES = [
  "https://copy.sh/v86/images/linux.iso",
  "https://k-mrs.github.io/images/linux.iso",
];

let modalEl = null;
let emulator = null;
let libLoadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script load failed: " + src));
    document.head.appendChild(s);
  });
}

function loadLibV86() {
  if (libLoadPromise) return libLoadPromise;
  libLoadPromise = loadScript(`${V86_CDN}/build/libv86.js`);
  return libLoadPromise;
}

function mountModal(hostTerm) {
  if (modalEl) { modalEl.style.display = "flex"; return modalEl; }
  modalEl = document.createElement("div");
  modalEl.className = "v86-modal";
  modalEl.innerHTML = `
    <div class="v86-frame">
      <div class="v86-titlebar">
        <span class="v86-title">INNOFLIGHT CFC-STAGING :: QEMU FALLBACK :: buildroot</span>
        <button class="v86-close" type="button" aria-label="close">[ X ]</button>
      </div>
      <div class="v86-status" data-v86-status>boot pending...</div>
      <div class="v86-screen" data-v86-screen>
        <div class="v86-screen-inner"></div>
      </div>
      <div class="v86-footnote">
        Real Linux running in WebAssembly via v86. Type inside the window. Esc to close.
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);
  const close = () => {
    modalEl.style.display = "none";
    try { emulator?.stop?.(); } catch {}
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

async function tryFetchOk(url) {
  try {
    const r = await fetch(url, { method: "HEAD", mode: "cors" });
    return r.ok;
  } catch { return false; }
}

async function pickImage() {
  for (const u of LINUX_IMAGE_CANDIDATES) {
    if (await tryFetchOk(u)) return u;
  }
  return null;
}

function kernelPanic() {
  const inner = modalEl.querySelector(".v86-screen-inner");
  inner.innerHTML = `<pre>
[   42.000000] Kernel panic - not syncing: could not reach CDN-hosted rootfs.
[   42.013200] CPU: 0 PID: 1 Comm: swapper Tainted: G    O    6.1.0-yocto-standard
[   42.013201] Hardware name: v86 virtual / CFC-STAGING, BIOS SeaBIOS
[   42.013202] Call Trace:
[   42.013203]  &lt;TASK&gt;
[   42.013204]  panic+0x10d/0x2f1
[   42.013205]  mount_block_root.cold+0x6a/0x6a
[   42.013206]  mount_root+0x12d/0x140
[   42.013207]  prepare_namespace+0x13a/0x175
[   42.013208]  ? rest_init+0xd0/0xd0
[   42.013209]  kernel_init+0x19/0x130
[   42.013210]  ret_from_fork+0x1f/0x30
[   42.013211]  &lt;/TASK&gt;

---[ end Kernel panic - not syncing: could not reach CDN-hosted rootfs. ]---

The real hardware is fine; the emulator's rootfs just isn't reachable
right now. Everything else on this site is unaffected. Close this modal
and keep poking the shell.
</pre>`;
  setStatus("STATUS :: DEGRADED — v86 rootfs unreachable");
}

function buildWelcomeScript() {
  // Heredoc script that prints bio content using the guest's own cat/echo.
  // Escaped for shell.
  const facts = compactFacts.map(f => " - " + f.replace(/'/g, "'\\''")).join("\n");
  return [
    "", // send a newline first to wake the shell
    "clear",
    "cat <<'__EOF__'",
    "",
    "  ===========================================================",
    "   INNOFLIGHT CFC-STAGING  ::  buildroot guest  ::  9p merge",
    "  ===========================================================",
    "",
    `  welcome, operator. this is a real Linux kernel running in WebAssembly.`,
    `  the bio below was cat'd through this guest's own coreutils:`,
    "",
    `  identity ........ ${identity.name}`,
    `  mail ............ ${identity.email}`,
    `  pitch ........... ${identity.pitch}`,
    "",
    "  resume-highlights --",
    facts,
    "",
    "  try:  uname -a ; cat /proc/cpuinfo ; ls /bin",
    "  the host page keeps running. close this modal anytime (Esc).",
    "",
    "__EOF__",
    "",
  ].join("\n");
}

export async function bootV86(hostTerm) {
  mountModal(hostTerm);
  setStatus("fetching libv86 from jsDelivr...");
  try {
    await loadLibV86();
  } catch (e) {
    hostTerm.print("[qemu] failed to load v86 library\n\n");
    kernelPanic();
    return;
  }

  setStatus("probing rootfs CDN...");
  const img = await pickImage();
  if (!img) {
    hostTerm.print("[qemu] no reachable rootfs CDN; showing panic\n\n");
    kernelPanic();
    return;
  }

  const screenContainer = modalEl.querySelector("[data-v86-screen]");
  // v86 wants a container with a specific child structure.
  screenContainer.innerHTML = `<div style="white-space: pre; font-family: VT323, monospace; line-height: 1;"></div><canvas style="display:none"></canvas>`;

  setStatus("booting kernel...");
  hostTerm.print(`[qemu] booting from ${img}\n`);
  hostTerm.print("[qemu] see modal window for guest tty\n\n");

  try {
    emulator = new V86({
      wasm_path: `${V86_CDN}/build/v86.wasm`,
      memory_size: 64 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      screen_container: screenContainer,
      bios: { url: `${V86_CDN}/bios/seabios.bin` },
      vga_bios: { url: `${V86_CDN}/bios/vgabios.bin` },
      cdrom: { url: img, async: true },
      autostart: true,
      disable_keyboard: false,
    });
  } catch (e) {
    console.warn("V86 ctor failed", e);
    kernelPanic();
    return;
  }

  // Wait for shell prompt on serial output, then type the welcome script.
  let serialBuf = "";
  let injected = false;
  const prompt = /[#$]\s*$/;
  emulator.add_listener("serial0-output-byte", (byte) => {
    const ch = String.fromCharCode(byte);
    serialBuf += ch;
    if (serialBuf.length > 4096) serialBuf = serialBuf.slice(-2048);
    if (!injected && prompt.test(serialBuf)) {
      injected = true;
      setStatus("STATUS :: OK — guest shell online, injecting bio...");
      const script = buildWelcomeScript();
      for (const ch2 of script) emulator.serial0_send(ch2);
    }
  });

  setStatus("STATUS :: kernel booting (this can take 10-30s)...");
  // Also reveal status as boot progresses via rudimentary polling.
  setTimeout(() => {
    if (!injected) setStatus("STATUS :: kernel booting (still working)...");
  }, 8000);
}
