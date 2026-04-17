// CFC-510 flavor firmware. Compiled to wasm32-unknown-unknown, loaded by
// the site's shell for the boot-time integrity check, `fsck`, and the
// `radiate` single-event-upset demo. No std::io; alloc via raw Vec.

use std::alloc::{alloc, dealloc, Layout};

#[no_mangle]
pub extern "C" fn cfc_alloc(len: usize) -> *mut u8 {
    if len == 0 { return 1 as *mut u8; }
    unsafe {
        let layout = Layout::from_size_align_unchecked(len, 1);
        let p = alloc(layout);
        if p.is_null() { std::process::abort(); }
        p
    }
}

#[no_mangle]
pub extern "C" fn cfc_dealloc(ptr: *mut u8, len: usize) {
    if len == 0 { return; }
    unsafe {
        let layout = Layout::from_size_align_unchecked(len, 1);
        dealloc(ptr, layout);
    }
}

// Standard CRC-32 (IEEE 802.3 poly 0xEDB88320).
#[no_mangle]
pub extern "C" fn crc32(ptr: *const u8, len: usize) -> u32 {
    let data = unsafe { std::slice::from_raw_parts(ptr, len) };
    let mut crc: u32 = 0xFFFF_FFFF;
    for &b in data {
        crc ^= b as u32;
        for _ in 0..8 {
            let mask = (!(crc & 1)).wrapping_add(1);
            crc = (crc >> 1) ^ (0xEDB8_8320 & mask);
        }
    }
    !crc
}

// xorshift32 — cheap deterministic PRNG, seeded from caller.
fn xorshift(state: &mut u32) -> u32 {
    let mut x = *state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *state = x;
    x
}

// Flip one random bit in the buffer. Returns the (byte, bit) index packed
// as (byte << 3 | bit) — lets the caller report what got hit.
#[no_mangle]
pub extern "C" fn seu_flip(ptr: *mut u8, len: usize, seed: u32) -> u32 {
    if len == 0 { return 0; }
    let buf = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
    let mut s = if seed == 0 { 0x9E37_79B9 } else { seed };
    let r = xorshift(&mut s);
    let byte_idx = (r as usize) % len;
    let bit_idx = ((r >> 16) as usize) & 7;
    buf[byte_idx] ^= 1 << bit_idx;
    ((byte_idx as u32) << 3) | (bit_idx as u32)
}

// Bitwise majority vote across three replicas. Writes the voted bytes to
// out. Returns the number of bytes that required correction (i.e. where
// at least one replica differed from the majority).
#[no_mangle]
pub extern "C" fn tmr_vote(
    a_ptr: *const u8, b_ptr: *const u8, c_ptr: *const u8,
    out_ptr: *mut u8, len: usize,
) -> u32 {
    let a = unsafe { std::slice::from_raw_parts(a_ptr, len) };
    let b = unsafe { std::slice::from_raw_parts(b_ptr, len) };
    let c = unsafe { std::slice::from_raw_parts(c_ptr, len) };
    let out = unsafe { std::slice::from_raw_parts_mut(out_ptr, len) };
    let mut corrected: u32 = 0;
    for i in 0..len {
        // bitwise majority: (a & b) | (a & c) | (b & c)
        let v = (a[i] & b[i]) | (a[i] & c[i]) | (b[i] & c[i]);
        if a[i] != v || b[i] != v || c[i] != v { corrected += 1; }
        out[i] = v;
    }
    corrected
}

// Deterministic pseudo-timestamp for the kernel boot log. Monotonically
// non-decreasing; small random jitter between successive calls.
#[no_mangle]
pub extern "C" fn boot_ts(n: u32) -> u32 {
    let mut s = 0x1337_C0DE ^ n.wrapping_mul(0x9E37_79B9);
    let jitter = xorshift(&mut s) % 90_000;
    // microseconds offset grows roughly log-linearly with call index.
    let base = (n.wrapping_mul(97_531)).wrapping_add(jitter);
    base
}
