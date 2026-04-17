// cfc-oracle fallback corpus. Triggered when Pollinations fails or times
// out. Intentionally same tone/length as the live model so the site feels
// identical in degraded mode.

export const monologues = [
  "Subject wrote a TensorFlow Lite GPU delegate for CUDA 6.5 — getting modern ML to run on a Jetson TK1 whose drivers predate the models by half a decade. Deep Kepler whispering a torch-jit graph. Not supposed to work. Does.",
  "On CFC510 the trick wasn't the APU, it wasn't the FPGA, it wasn't even the ECC strategy. It was the custom BIOS. Initializing an x86 platform deterministically for space is less 'boot a computer' and more 'hand-convince a civilian chip that it lives on orbit now.'",
  "Yocto, on orbit, means you own every byte of the rootfs signed and you own what runs at PID 1. The subject's Buildroot/Yocto work on CFC-family flight computers produces images that are cryptographically authenticated from U-Boot through the last systemd unit.",
  "Triple-modular redundancy in hardware is well-understood silicon. TMR implemented in software, across heterogeneous compute — CPU, AIE, DPU — as on CFC600 — is its own kind of lunacy. Three independent execution traces, one majority vote, every cycle that matters.",
  "VHDL + SystemVerilog on PolarFire, C and Rust on the APU side, Python where humans have to look. On CFC510 the subject wrote the PCIe driver stack that moved data between those two worlds at a rate that kept the AI inference pipeline fed.",
  "Heavy ion + proton SEE validation is not a simulation. You walk a flight computer into a beam line and watch which bit flips first. The subject has assisted this on the CFC500 — writing the error-detection firmware that caught the flips the beam inflicted.",
  "The submarine, the `FullHull.stl` spinning in the corner of this viewport — that's the SDSU Mechatronics AUV 'Perseverance.' The subject led its software stack. Two AUVSI RoboSub papers followed: Scion (2020), Pico (2021).",
  "An embedded Intrusion Detection System built on computational geometry and graph analysis is not a buzzword salad. It is a real IDS that recognizes anomaly as a distance in a non-Euclidean feature space. The subject built it.",
  "Autonomy at the edge isn't one skill. It is model optimization, it is a real-time inference pipeline, it is batch-execution strategy, it is every joule of power budget. The subject does all four.",
  "MPE-600: a 10-person engineering team, led. Multi-master communication protocols, high-availability failover, automated firmware validation, and the CI/CD that keeps any of that sane to ship.",
  "An FPGA-assisted rollback-protection mechanism means this: a tampered firmware image — even one signed by a compromised update pipeline — cannot execute. The hardware refuses. The subject designed this on CFC600.",
  "The subject's degree is Applied Mathematics with a CS emphasis. Coding theory, algebraic geometry, chaotic systems. The non-obvious reason a flight-computer architect comes from applied math: error correction is algebra, TMR voting is Boolean algebra, and a radiation environment is a stochastic process.",
  "Scatter-gather DMA over a PCIe-to-AXI bridge, with BAR window sizing tuned to a specific AI workload — this is the kind of work that shows up on a resume as one bullet but is three weeks of oscilloscope time.",
  "ROCm on a space computer. Let that settle. The subject delivered the first ROCm-capable radiation-tolerant flight computer at Innoflight. TensorFlow on an AMD APU, in orbit.",
  "The subject was a TA for Object-Oriented Programming — C++, Python, Java. So the ability to explain this stack to someone who does not have it is also on the table.",
  "LEO versus GEO isn't just altitude, it is a different fault model. Transient SEUs dominate one, total-dose creep dominates the other. The subject's adaptive reboot strategy on CFC510 reads the orbit and decides accordingly.",
  "On the Perseverance AUV the subject re-implemented the hot path in C via CPython, eliminated Python for-loops in the navigation loop, and leaned on floating-point hardware instead of interpreter cycles. Runtime dropped. The AUV surfaced faster.",
  "The subject has shipped heterogeneous compute partitioning that dynamically reassigns AI, FPGA, and CPU resources against live telemetry. Not a static DAG. A closed-loop scheduler with orbit-derived inputs.",
  "Linux containers (LXC + docker) running on a quad-core ARM Cortex-A57 TX2 inside an autonomous submarine: that's the subject modularizing nav software the way the rest of the industry modularizes web services, but underwater.",
  "There is a type of engineer who knows the U-Boot config, the kernel subsystem, the FPGA bitstream, and the ML quantization strategy that all have to agree for an image to make orbit. This is that engineer.",
];

// Topic-keyed responses for `ask <question>`. Keywords are matched
// case-insensitive; first match wins.
export const topicResponses = [
  { keys: ["vhdl", "verilog", "systemverilog", "hdl", "rtl"],
    text: "VHDL + SystemVerilog are primary HDLs for the subject. On the CFC family they ride on Microsemi PolarFire and Xilinx Zynq / MPSoC / Versal, implementing ECC offload, PCIe-to-AXI bridges, and the FPGA half of the TMR voter that the software side orchestrates." },
  { keys: ["yocto", "buildroot", "embedded linux", "openembedded", "poky"],
    text: "Yocto + Buildroot are how the subject ships rootfs images on the CFC flight computers. Signed from U-Boot to the last systemd unit, with cryptographic authentication and FPGA-assisted rollback protection. The Linux you are looking at right now is themed after one of those images." },
  { keys: ["radiation", "seu", "rad", "tmr", "total dose"],
    text: "Radiation tolerance is layered: adaptive NAND ECC + software-defined wear-leveling, software TMR across heterogeneous compute elements, FPGA-supervised DMA snapshots for rollback, and orbit-aware reboot strategy (LEO vs GEO). The subject also assisted heavy-ion + proton SEE validation on CFC500." },
  { keys: ["ai", "tensorflow", "pytorch", "rocm", "cuda", "inference", "ml", "dpu", "aie"],
    text: "On CFC510 the subject delivered the first ROCm-capable rad-tolerant flight computer — TensorFlow inference on an AMD V1605B APU. On CFC600 that extends to Versal AIE acceleration and DPU-targeted quantization-aware models. On CFC500 it was a TFLite GPU delegate backported onto CUDA 6.5. The through-line: modern ML on hardware the industry said was too constrained." },
  { keys: ["auv", "submarine", "underwater", "robosub", "perseverance", "scion", "pico"],
    text: "The subject led software + control systems on the SDSU Mechatronics AUV 'Perseverance.' OpenCV vision, ARM + PIC coprocessors for sensor ingest + thruster control, LXC / docker containerization on a Jetson TX2, C-through-CPython for the hot path. Two AUVSI RoboSub papers: Scion (2020), Pico (2021)." },
  { keys: ["security", "secure boot", "ids", "intrusion", "crypto", "signing"],
    text: "Security is posture, not a feature: secure boot, cryptographic integrity verification, signed firmware, FPGA-assisted rollback so tampered images can't execute even if the update pipeline is compromised, and an embedded IDS that uses computational geometry + graph analysis for anomaly detection." },
  { keys: ["fpga", "polarfire", "zynq", "versal", "xilinx", "microsemi"],
    text: "FPGAs touched: Microsemi PolarFire on CFC510, Xilinx Zynq-7000 / MPSoC / Versal on CFC600 and related work. The subject writes both sides of the divide — HDL on the fabric, C/Rust drivers on the processor — which is the actual skill, since the interesting bugs live on the boundary." },
  { keys: ["team", "lead", "management", "coordinator"],
    text: "On MPE-600 the subject led a 10-person engineering team delivering a fault-tolerant multiprocessor platform. Multi-master comms, high-availability failover, automated firmware validation, CI/CD. Technical-lead + architect patterns throughout Innoflight tenure." },
  { keys: ["education", "school", "math", "degree", "sdsu"],
    text: "BS Applied Mathematics with a CS emphasis from San Diego State. Coursework: machine learning, distributed systems, coding theory, algebraic geometry, chaotic systems, optimization. TA'd object-oriented programming in C++, Python, Java." },
  { keys: ["rust", "c++", "cpp", "python", "language"],
    text: "Languages: Bash, Python, C, C++, Rust, VHDL, SystemVerilog. Rust and C dominate the embedded + firmware surface. Python for tooling + nav glue. C++ historically on CFC tooling. The WASM module running this terminal's firmware-integrity check is compiled from Rust — meta." },
  { keys: ["contact", "email", "hire", "reach"],
    text: "Contact: christian.d.gould@gmail.com. Phone available via 'contact --phone' in this shell. Located in San Diego. Actively at Innoflight as of the latest resume; inquire directly." },
];

export function pickMonologue() {
  return monologues[Math.floor(Math.random() * monologues.length)];
}

export function findTopic(question) {
  const q = question.toLowerCase();
  for (const t of topicResponses) {
    for (const k of t.keys) {
      if (q.includes(k)) return t.text;
    }
  }
  return null;
}
