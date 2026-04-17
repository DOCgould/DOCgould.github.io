// Hand-written loader for cfc_firmware.wasm. No bindgen glue.
// Exposes crc32 / seuFlip / tmrVote / bootTs convenience wrappers that
// handle copying JS bytes into WASM linear memory.

let wasm = null;
let exportsRef = null;

export async function initWasm() {
  if (wasm) return wasm;
  try {
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch("assets/wasm/cfc_firmware.wasm"),
      {}
    );
    exportsRef = instance.exports;
    wasm = { ok: true };
    return wasm;
  } catch (e) {
    console.warn("[cfc_firmware] WASM init failed:", e);
    wasm = { ok: false };
    return wasm;
  }
}

function writeBytes(bytes) {
  const { cfc_alloc, memory } = exportsRef;
  const ptr = cfc_alloc(bytes.length);
  new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
  return ptr;
}

function readBytes(ptr, len) {
  return new Uint8Array(exportsRef.memory.buffer, ptr, len).slice();
}

function freeBytes(ptr, len) {
  exportsRef.cfc_dealloc(ptr, len);
}

export function crc32(input) {
  if (!wasm?.ok) return 0;
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const ptr = writeBytes(bytes);
  const r = exportsRef.crc32(ptr, bytes.length) >>> 0;
  freeBytes(ptr, bytes.length);
  return r;
}

// Flip one bit in a copy of the bytes, return {mutated, byte, bit}.
export function seuFlip(input, seed = Date.now() & 0xffffffff) {
  if (!wasm?.ok) return { mutated: input, byte: 0, bit: 0 };
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const ptr = writeBytes(bytes);
  const packed = exportsRef.seu_flip(ptr, bytes.length, seed >>> 0) >>> 0;
  const out = readBytes(ptr, bytes.length);
  freeBytes(ptr, bytes.length);
  return { mutated: out, byte: packed >>> 3, bit: packed & 7 };
}

// TMR vote: three Uint8Array inputs of same length → recovered bytes
// and corrected-byte count.
export function tmrVote(a, b, c) {
  if (!wasm?.ok) return { out: a.slice(), corrected: 0 };
  const len = a.length;
  const pa = writeBytes(a);
  const pb = writeBytes(b);
  const pc = writeBytes(c);
  const po = exportsRef.cfc_alloc(len);
  const corrected = exportsRef.tmr_vote(pa, pb, pc, po, len) >>> 0;
  const out = readBytes(po, len);
  freeBytes(pa, len); freeBytes(pb, len); freeBytes(pc, len); freeBytes(po, len);
  return { out, corrected };
}

export function bootTs(n) {
  if (!wasm?.ok) return n * 1000;
  return exportsRef.boot_ts(n >>> 0) >>> 0;
}

export function wasmReady() { return !!wasm?.ok; }
