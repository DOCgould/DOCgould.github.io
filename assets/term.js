// Terminal renderer. Owns the output buffer DOM and the input prompt.
// Handles character-at-a-time printing, line breaks, command history,
// and exposes a simple async API for the shell.

const PROMPT = "christian@cfc510:~$ ";

export class Terminal {
  constructor(root) {
    this.root = root;
    this.out = root.querySelector("[data-out]");
    this.promptEl = root.querySelector("[data-prompt]");
    this.input = root.querySelector("[data-input]");
    this.history = [];
    this.histIdx = 0;
    this.locked = false;
    this.abortReq = null;
    this.onSubmit = null;

    this.input.addEventListener("keydown", (e) => this._onKey(e));
    root.addEventListener("click", () => { if (!this.locked) this.input.focus(); });
    this.promptEl.textContent = PROMPT;
  }

  _onKey(e) {
    if (this.locked && e.key !== "Escape" && e.key !== "c") return;
    if (this.locked && e.key === "Escape") { this.abortReq?.(); return; }

    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = this.input.value;
      this.input.value = "";
      this.print(PROMPT + cmd + "\n");
      if (cmd.trim()) {
        this.history.push(cmd);
        this.histIdx = this.history.length;
      }
      if (this.onSubmit) this.onSubmit(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (this.history.length === 0) return;
      this.histIdx = Math.max(0, this.histIdx - 1);
      this.input.value = this.history[this.histIdx] ?? "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this.histIdx = Math.min(this.history.length, this.histIdx + 1);
      this.input.value = this.history[this.histIdx] ?? "";
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      this.clear();
    }
  }

  print(text) {
    this.out.appendChild(document.createTextNode(text));
    this.scrollToEnd();
  }

  // Character-at-a-time typewriter effect. Used for streaming LLM output
  // and for slow print passages in the boot log. Returns a cancel handle.
  async typeStream(iterable, cps = 180) {
    const delay = 1000 / cps;
    for await (const chunk of iterable) {
      for (const ch of chunk) {
        this.out.appendChild(document.createTextNode(ch));
        if (ch === "\n" || Math.random() < 0.03) this.scrollToEnd();
        await new Promise(r => setTimeout(r, delay));
      }
    }
    this.scrollToEnd();
  }

  // Print a whole string with typewriter cadence. Respects reduced-motion.
  async typeln(s, cps = 400) {
    if (document.body.classList.contains("safe-mode")
        || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      this.print(s + "\n");
      return;
    }
    const delay = 1000 / cps;
    for (const ch of s) {
      this.out.appendChild(document.createTextNode(ch));
      await new Promise(r => setTimeout(r, delay));
    }
    this.out.appendChild(document.createTextNode("\n"));
    this.scrollToEnd();
  }

  clear() {
    this.out.textContent = "";
  }

  scrollToEnd() {
    this.root.scrollTop = this.root.scrollHeight;
  }

  lock() { this.locked = true; this.promptEl.textContent = ""; this.input.disabled = true; }
  unlock() { this.locked = false; this.promptEl.textContent = PROMPT; this.input.disabled = false; this.input.focus(); }

  focus() { this.input.focus(); }
}
