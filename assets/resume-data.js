// Structured facts from RESUME_GOULD_2025.pdf. Single source of truth for
// the shell's cat/ls/experience/skills commands and for seeding the LLM
// system prompt.

export const identity = {
  name: "Christian Gould",
  email: "christian.d.gould@gmail.com",
  phone: "619-558-4699", // surfaced only by `contact --phone`
  pitch: "Flight-computer software architect. Radiation-tolerant embedded systems, AI-at-the-edge, FPGA-accelerated Linux.",
};

export const compactFacts = [
  "Technical lead + software architect at Innoflight (2020-present) on the CFC family of radiation-tolerant flight computers.",
  "CFC510 (AMD V1605B APU): built first ROCm-capable space computer, TensorFlow inference, custom BIOS, FPGA-supervised DMA rollback.",
  "CFC600 (AMD Versal): heterogeneous CPU+AIE+DPU partitioning, multi-layer TMR in software, cryptographic secure update pipeline.",
  "MPE-600: led 10-engineer team; multi-master comms, high-availability failover, real-time telemetry, CI/CD.",
  "CFC500 (Nvidia Jetson TK1): wrote TFLite GPU delegate for CUDA 6.5, dual-TK1 split, SEE heavy-ion + proton radiation validation.",
  "Cyber IDS research: anomaly detection via computational geometry + graph analysis, signed-firmware integrity.",
  "SDSU Mechatronics AUV (2019-21): lead on Perseverance; OpenCV vision, ARM+PIC coprocessors, LXC+docker on Jetson TX2.",
  "Published AUVSI RoboSub papers on Scion (2020) and Pico (2021).",
  "BS Applied Mathematics (CS emphasis) from San Diego State. TA'd OOP in C++/Python/Java.",
  "Stack: Rust, C/C++, VHDL/SystemVerilog, Python, Bash, Yocto/Buildroot, FreeRTOS, UEFI, Xilinx Zynq/MPSoC/Versal, PolarFire, AMD Ryzen Embedded, RISC-V, ARM Cortex-A/R/M.",
];

export const experience = [
  {
    company: "Innoflight, LLC",
    period: "2020 — Present",
    role: "Technical Lead, Software Architect, Internal Researcher — Compact Flight Computers",
    projects: [
      {
        name: "CFC510 AMD Flight Computer — Lead Engineer",
        bullets: [
          "Designed x86 real-time software stack merging rad-tolerant embedded computing with high-performance AI inference for space missions.",
          "Built the company's first ROCm-capable space computer, enabling TensorFlow inference on an AMD V1605B APU for onboard data analysis.",
          "Fault-tolerant software recovery with FPGA-supervised DMA snapshots for rapid rollback on GEO missions.",
          "Custom BIOS firmware for hardware-level control over system initialization; deterministic behavior for real-time autonomous ops.",
          "Multi-layer NAND error mitigation: software-defined wear-leveling, adaptive ECC, predictive failure analytics.",
          "Adaptive reboot strategy tuned per-orbit (LEO vs GEO) for transient-fault handling + FPGA-assisted hibernation recovery.",
          "FPGA-offloaded parity/syndrome computation cut CPU overhead on error-correction paths.",
          "Custom PCIe memory driver stack between the AMD APU and a PolarFire FPGA.",
          "Real-time memory mapping over PCIe-to-AXI bridges; scatter-gather DMA tuned for telemetry + AI workloads.",
        ],
      },
      {
        name: "CFC600 AMD Versal Flight Computer — System Architect",
        bullets: [
          "Heterogeneous model integrating Versal AI Engine (AIE) acceleration with real-time Linux kernel subsystems.",
          "Software-controlled dynamic partitioning of AI / FPGA / CPU resources against live telemetry.",
          "Real-time AI inference pipeline with quantization-aware ML models targeting AMD's DPU.",
          "Multi-layer software-level TMR across heterogeneous processing elements.",
          "Distributed system-state validation algorithm — verifies processor correctness, triggers automatic recovery on radiation-induced faults.",
          "Cryptographically authenticated firmware update system.",
          "FPGA-assisted rollback protection: tampered images cannot execute, even under a compromised update pipeline.",
          "Hardware-backed cryptographic integrity monitoring against supply-chain + in-orbit cyber threats.",
        ],
      },
      {
        name: "MPE-600 Flight Computer — Systems Lead + Team Coordinator",
        bullets: [
          "Led a 10-person engineering team.",
          "Fault-tolerant multiprocessor computing platform.",
          "Optimized multi-master communication protocols.",
          "High-availability failover mechanisms for continuous operation.",
          "Advanced system diagnostics + real-time telemetry for high-speed interconnects.",
          "Automated firmware validation; CI/CD for system updates and test.",
        ],
      },
      {
        name: "CFC500 Nvidia Jetson Flight Computer — Optimization + Performance",
        bullets: [
          "Enhanced inference efficiency on embedded GPUs.",
          "Wrote a TensorFlow Lite GPU delegate targeting CUDA 6.5 to run modern ML models on legacy drivers.",
          "Dual-TK1 architecture splitting real-time workloads from security-update cadence.",
          "Ensured compatibility across mixed-kernel environments to maintain hardware functionality.",
          "PCIe data-transfer tuning, scatter-gather, BAR-window sizing for TK1 ↔ FPGA throughput.",
          "Assisted Heavy-Ion + Proton Single-Event-Effect radiation validation.",
          "Real-time error-detection firmware for operational stability.",
        ],
      },
      {
        name: "Embedded Systems R&D",
        bullets: [
          "Performance-optimization strategies for constrained embedded targets.",
          "FPGA-vs-conventional architecture benchmarking.",
          "High-speed memory management + FPGA-based acceleration framework.",
        ],
      },
      {
        name: "Cybersecurity + Intrusion Detection",
        bullets: [
          "Embedded Intrusion Detection System (IDS).",
          "Anomaly detection built on computational geometry + graph analysis.",
          "Resilient firmware integrity: cryptographic signing + redundant storage for hardware-backed immutability.",
        ],
      },
    ],
  },
  {
    company: "SDSU Mechatronics",
    period: "2019 — 2021",
    role: "Autonomous Underwater Vehicle — Software Architect + Control Systems + Project Lead",
    projects: [
      {
        name: "Perseverance AUV",
        bullets: [
          "Software Lead + Project Manager.",
          "New training algorithms for Perseverance.",
          "OS method with hardware-compilation optimizations: regular FP, de-Pythonized loops, C re-impls via CPython for the hot path.",
          "OpenCV computer-vision for underwater obstacle recognition + visual-cue navigation.",
          "Programmed ARM + PIC coprocessors for sensor ingest and servo / brushed-DC thruster control.",
          "REST API for talking to the quad-core ARM Cortex-A57 TX2 SoM; kept low-priority RAM/CPU pressure off the nav processors.",
          "LXC + docker containers to modularize application software on primary nav processors.",
        ],
      },
    ],
  },
];

export const skills = {
  "Programming & HDL": "Bash, Python, C, C++, Rust, VHDL, SystemVerilog. Linux kernel modules + FPGA logic for high-reliability flight systems.",
  "Embedded Compute / Accel": "TensorFlow, PyTorch, OpenCV, OpenMPI, CUDA, YOLO/Darknet, Xilinx HLS, FPGA acceleration. Model + hardware co-optimization on constrained targets.",
  "Embedded Systems + Security": "Secure boot, cryptographic integrity verification, high-efficiency memory mgmt, Linux kernel dev, FreeRTOS, Yocto/Buildroot, UEFI.",
  "AI + Edge Inference": "Model optimization, real-time inference pipelines, batch execution, power-efficient AI. Autonomy on resource-constrained edge hardware.",
  "Hardware & Platforms": "NVIDIA Jetson (TK1/TX1/TX2/Xavier), Xilinx Zynq-7000/MPSoC/Versal, Microsemi PolarFire, AMD Embedded Ryzen (V1000/R1000), RISC-V, ARM Cortex-A/R/M.",
};

export const publications = [
  {
    cite: 'Walker-Howell P, Gould C, et al. "2019-2020: SDSU Mechatronics AUV (Scion): Design and Implementation." AUVSI 17th RoboSub Competition Journal Papers, August 2020.',
  },
  {
    cite: 'Gomez S, Gould C, et al. "2020-2021: SDSU Mechatronics AUV (Pico): Design and Implementation." AUVSI 17th RoboSub Competition Journal Papers, August 2021.',
  },
];

export const education = {
  school: "San Diego State University",
  degree: "Bachelor of Science in Applied Mathematics, Computer Science Emphasis",
  notable: "Machine Learning, Distributed Systems, Coding Theory, Algebraic Geometry, Chaotic Systems, Optimization",
  teaching: "Teaching Assistant for Object-Oriented Programming — C++, Python, Java. Debugging support + software-design coaching.",
};

// Virtual filesystem surfaced by `ls /proc/christian` + `cat <path>`.
export const procFs = {
  "/proc/christian/bio.txt":
    `${identity.name}\n${identity.pitch}\n\nContact: ${identity.email}\n(phone redacted — use 'contact --phone' to reveal)`,
  "/proc/christian/skills/languages":
    skills["Programming & HDL"],
  "/proc/christian/skills/embedded":
    skills["Embedded Systems + Security"],
  "/proc/christian/skills/accel":
    skills["Embedded Compute / Accel"],
  "/proc/christian/skills/ai":
    skills["AI + Edge Inference"],
  "/proc/christian/skills/hardware":
    skills["Hardware & Platforms"],
  "/proc/christian/education":
    `${education.school}\n${education.degree}\n\nNotable coursework: ${education.notable}\n\n${education.teaching}`,
  "/proc/christian/publications":
    publications.map(p => "* " + p.cite).join("\n\n"),
  "/proc/christian/motd":
    "INNOFLIGHT CFC-510 :: Welcome, operator.\nType 'help' for commands, 'narrate' for an oracle briefing, 'qemu' to boot the guest image.",
};
