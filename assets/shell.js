// Command dispatcher for the flight-computer shell.

import { identity, experience, skills, publications, education, procFs, compactFacts } from "./resume-data.js";
import { ask as llmAsk, narrate as llmNarrate } from "./llm.js";
import { crc32, seuFlip, tmrVote, wasmReady } from "./wasm-loader.js";
import { bootV86 } from "./v86-boot.js";

const HELP = [
  "  help                    — this screen",
  "  whoami                  — identity + pitch",
  "  contact --phone         — reveal phone (click-to-reveal equivalent)",
  "  ls /proc/christian      — list virtual files",
  "  cat <path>              — print a virtual file",
  "  experience [company]    — roles + projects",
  "  skills [group]          — technical skills",
  "  publications            — AUVSI RoboSub papers",
  "  education               — school + coursework",
  "  ask <question>          — cfc-oracle answers (streams from free LLM)",
  "  narrate                 — oracle monologue, unprompted",
  "  radiate                 — simulate SEU, watch TMR voter recover",
  "  fsck                    — WASM CRC32 check of resume-data",
  "  launch-sim              — open the Babylon.js submarine sim (new tab)",
  "  qemu                    — boot a real Linux in-page via v86 (with resume injected)",
  "  uname / date / uptime   — flavor",
  "  clear / reboot          — as expected",
  "",
  "  Esc or Ctrl+L           — cancel / clear",
];

let BOOT_T0 = Date.now();

export async function handle(cmd, term) {
  const raw = cmd.trim();
  if (!raw) return;
  const [head, ...rest] = raw.split(/\s+/);
  const arg = rest.join(" ");

  try {
    switch (head) {
      case "help":
        HELP.forEach(l => term.print(l + "\n"));
        term.print("\n");
        break;

      case "whoami":
        term.print(`${identity.name}\n${identity.pitch}\n\nemail:  ${identity.email}\nphone:  [redacted — 'contact --phone' to reveal]\n\n`);
        break;

      case "contact":
        if (rest.includes("--phone")) {
          term.print(`phone: ${identity.phone}\n\n`);
        } else {
          term.print(`email: ${identity.email}\nphone: [redacted — use '--phone' to reveal]\n\n`);
        }
        break;

      case "ls":
        await cmdLs(arg, term);
        break;

      case "cat":
        await cmdCat(arg, term);
        break;

      case "experience":
        cmdExperience(arg, term);
        break;

      case "skills":
        cmdSkills(arg, term);
        break;

      case "publications":
        publications.forEach(p => term.print("* " + p.cite + "\n\n"));
        break;

      case "education":
        term.print(`${education.school}\n${education.degree}\n\nNotable coursework:\n  ${education.notable}\n\n${education.teaching}\n\n`);
        break;

      case "ask":
        if (!arg) { term.print("usage: ask <question>\n\n"); break; }
        term.lock();
        term.print("cfc-oracle> ");
        await llmAsk(arg, ch => term.print(ch));
        term.print("\n\n");
        term.unlock();
        break;

      case "narrate":
        term.lock();
        term.print("cfc-oracle> ");
        await llmNarrate(ch => term.print(ch));
        term.print("\n\n");
        term.unlock();
        break;

      case "radiate":
        await cmdRadiate(term);
        break;

      case "fsck":
        await cmdFsck(term);
        break;

      case "launch-sim":
        term.print("launching Babylon.js submarine sim in new tab...\n\n");
        window.open("flight/", "_blank");
        break;

      case "qemu":
        term.lock();
        term.print("[qemu] fetching v86 + rootfs (this may take a moment)...\n");
        await bootV86(term);
        term.unlock();
        break;

      case "clear":
        term.clear();
        break;

      case "reboot":
        term.print("rebooting...\n\n");
        await new Promise(r => setTimeout(r, 400));
        location.reload();
        break;

      case "uname":
        term.print("Linux cfc510 6.1.0-yocto-standard #1 SMP x86_64 GNU/Linux\n\n");
        break;

      case "date":
        term.print(new Date().toString() + "\n\n");
        break;

      case "uptime":
        const up = Math.floor((Date.now() - BOOT_T0) / 1000);
        term.print(`${new Date().toLocaleTimeString()}  up ${up}s,  1 user,  load average: 0.42, 0.37, 0.29\n\n`);
        break;

      case "echo":
        term.print(arg + "\n\n");
        break;

      case "sudo":
        term.print("christian is not in the sudoers file.  This incident will be transmitted to ground.\n\n");
        break;

      default:
        term.print(`${head}: command not found.  try 'help'.\n\n`);
    }
  } catch (e) {
    term.print(`\n[shell] ${e.message || e}\n\n`);
    term.unlock();
  }
}

async function cmdLs(arg, term) {
  const path = arg || "/proc/christian";
  const entries = Object.keys(procFs)
    .filter(p => p.startsWith(path))
    .map(p => p.slice(path.length).replace(/^\//, ""))
    .filter(p => p && !p.includes("/..."))
    .sort();
  if (entries.length === 0) {
    term.print(`ls: cannot access '${path}': No such file or directory\n\n`);
    return;
  }
  // group by first segment so nested paths look like directories
  const seen = new Set();
  for (const e of entries) {
    const first = e.split("/")[0];
    if (seen.has(first)) continue;
    seen.add(first);
    const isDir = entries.some(x => x !== first && x.startsWith(first + "/"));
    term.print((isDir ? first + "/" : first) + "\n");
  }
  term.print("\n");
}

async function cmdCat(arg, term) {
  if (!arg) { term.print("usage: cat <path>\n\n"); return; }
  const text = procFs[arg];
  if (text === undefined) {
    term.print(`cat: ${arg}: No such file or directory\n\n`);
    return;
  }
  term.print(text + "\n\n");
}

function cmdExperience(arg, term) {
  const filter = arg.toLowerCase();
  for (const job of experience) {
    if (filter && !job.company.toLowerCase().includes(filter)) continue;
    term.print(`${job.company}    (${job.period})\n  ${job.role}\n\n`);
    for (const p of job.projects) {
      term.print(`  ── ${p.name}\n`);
      for (const b of p.bullets) term.print(`     • ${b}\n`);
      term.print("\n");
    }
  }
}

function cmdSkills(arg, term) {
  const filter = arg.toLowerCase();
  for (const [group, text] of Object.entries(skills)) {
    if (filter && !group.toLowerCase().includes(filter)) continue;
    term.print(`[${group}]\n  ${text}\n\n`);
  }
}

async function cmdRadiate(term) {
  term.print("[radmon] simulating single-event upset...\n");
  await sleep(200);
  const msg = "christian.d.gould@gmail.com :: CFC510 :: nominal";
  const bytes = new TextEncoder().encode(msg);
  const a = bytes.slice(); const c = bytes.slice();
  // strike replica B with a single-bit flip
  const flip = seuFlip(bytes.slice(), (Math.random() * 0xffffffff) >>> 0);
  const b = flip.mutated;
  const { byte, bit } = flip;
  document.body.classList.add("rad-glitch");
  await sleep(180);
  document.body.classList.remove("rad-glitch");
  term.print(`[radmon] SEU detected: replica=B, byte=${byte}, bit=${bit}\n`);
  await sleep(120);
  const v = tmrVote(a, b, c);
  term.print(`[radmon] TMR vote complete: ${v.corrected} byte(s) corrected\n`);
  await sleep(120);
  const recovered = new TextDecoder().decode(v.out);
  term.print(`[radmon] recovered payload: "${recovered}"\n`);
  term.print(`[radmon] integrity OK\n\n`);
}

async function cmdFsck(term) {
  term.print("[fsck] computing CRC32 over resume-data ...\n");
  await sleep(150);
  const sum = crc32(compactFacts.join("\n")) >>> 0;
  await sleep(150);
  term.print(`[fsck] CRC32 = 0x${sum.toString(16).padStart(8, "0")}\n`);
  term.print(`[fsck] WASM firmware: ${wasmReady() ? "loaded" : "MISSING (fallback)"}\n`);
  term.print(`[fsck] status: CLEAN\n\n`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
