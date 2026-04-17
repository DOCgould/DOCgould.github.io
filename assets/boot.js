// Boot-log sequencer. Prints a plausible U-Boot → Linux 6.1 → poky
// sysvinit trace, calling the WASM module for a real CRC check on the
// resume data partway through. Skippable by any keypress.

import { crc32, wasmReady } from "./wasm-loader.js";
import { compactFacts } from "./resume-data.js";

function fmt(t) {
  // "[    X.YYYYYY]" formatted like kernel dmesg.
  const sec = Math.floor(t / 1_000_000);
  const us = t - sec * 1_000_000;
  const pad = String(sec).padStart(5);
  const usStr = String(us).padStart(6, "0");
  return `[${pad}.${usStr}]`;
}

export async function runBoot(term) {
  let skipped = false;
  const onKey = () => { skipped = true; };
  window.addEventListener("keydown", onKey, { once: false });

  const lines = [
    ["plain", ""],
    ["plain", "U-Boot 2023.07 (Innoflight CFC-510 build)"],
    ["plain", ""],
    ["plain", "Board:   AMD V1605B APU @ 2.0 GHz, ECC enabled"],
    ["plain", "DRAM:    4 GiB DDR4 ECC"],
    ["plain", "PCIe:    link up to Microsemi PolarFire FPGA (x4 Gen2)"],
    ["plain", "MMC:     mmc@ff160000: 0"],
    ["plain", "Loading Environment from SPI Flash... OK"],
    ["plain", "Verifying FIT signature... OK"],
    ["plain", "Loading kernel (poky-6.1)... OK"],
    ["plain", "Loading DTB... OK"],
    ["plain", "Starting kernel ..."],
    ["plain", ""],
    ["dmesg", 0,      "Linux version 6.1.0-yocto-standard (oe-user@poky) (gcc 12.2) #1 SMP"],
    ["dmesg", 11204,  "Command line: console=ttyS0,115200 root=/dev/mmcblk0p2 ro rootwait cfc.orbit=GEO"],
    ["dmesg", 103019, "smpboot: CPU0: AMD Ryzen Embedded V1605B (family: 0x17, model: 0x11)"],
    ["dmesg", 284013, "radmon: triple modular redundancy voter online"],
    ["dmesg", 312481, "radmon: software-TMR syndrome table loaded (12 banks)"],
    ["dmesg", 412783, "rocm: initializing DPU inference stack"],
    ["dmesg", 510204, "pci 0000:01:00.0: [11aa:1556] PolarFire endpoint, 4x Gen2 link"],
    ["dmesg", 603441, "nand: wear-leveling policy = adaptive-ecc-v2"],
    ["dmesg", 804221, "EXT4-fs (mmcblk0p2): mounted filesystem with ordered data mode"],
    ["dmesg", 1003441,"cfc-secure: firmware signature OK (PKCS#7, sha256)"],
    ["plain", ""],
    ["plain", "INIT: version 3.01 booting"],
    ["plain", "Starting udev: done."],
    ["plain", "Configuring network interfaces... done."],
    ["plain", "Starting system message bus: dbus."],
    ["plain", "Starting telemetry-daemon: telem."],
    ["check", null],
    ["plain", "Starting cfc-oracle (LLM narrator): oracle."],
    ["plain", ""],
    ["plain", "Poky (Yocto Project Reference Distro) 4.3.1 cfc510 /dev/ttyS0"],
    ["plain", ""],
    ["plain", "cfc510 login: christian (auto)"],
    ["plain", "Last login: from uplink"],
    ["plain", ""],
  ];

  for (const entry of lines) {
    if (skipped) { term.print(""); break; }
    const [kind, a, b] = entry;
    if (kind === "plain") {
      term.print(a + "\n");
      await sleep(30 + Math.random() * 60);
    } else if (kind === "dmesg") {
      term.print(`${fmt(a)} ${b}\n`);
      await sleep(20 + Math.random() * 40);
    } else if (kind === "check") {
      term.print("Verifying resume-data integrity (CRC32)... ");
      await sleep(200);
      const payload = compactFacts.join("\n");
      const sum = crc32(payload) >>> 0;
      const mark = wasmReady() ? "OK" : "OK (sw)";
      term.print(`${mark} (crc=0x${sum.toString(16).padStart(8,"0")})\n`);
      await sleep(80);
    }
  }

  if (skipped) {
    term.print("\n[boot] sequence skipped\n\n");
  }
  window.removeEventListener("keydown", onKey);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
