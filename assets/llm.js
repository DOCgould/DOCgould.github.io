// Pollinations.ai streaming client with fallback. One of these per `ask`
// or `narrate` invocation. Calls back `onToken` as text streams in;
// resolves when complete. On any failure path — network error, non-2xx,
// content-type wrong, >8 s with zero tokens — transparently switches to
// oracle-fallback.js and flags the top bar as DEGRADED.

import { compactFacts, identity } from "./resume-data.js";
import { pickMonologue, findTopic } from "./oracle-fallback.js";

const SYSTEM_PROMPT = [
  `You are "cfc-oracle", a daemon on an emulated flight-computer terminal displaying the resume of ${identity.name}.`,
  "Speak in crisp technical prose with a subtle dramatic flair. Short paragraphs. No lists. No markdown. No emoji.",
  "Never invent skills or projects not grounded in the facts below. If asked for something unsupported, decline briefly and redirect.",
  "Refer to him as 'the subject' or by his surname. Keep responses to 2-6 sentences unless asked for more.",
  "",
  "FACTS:",
  ...compactFacts.map(f => "- " + f),
].join("\n");

// OpenAI-compatible POST endpoint. Migrated off the legacy GET shortcut
// that Pollinations is deprecating.
const ENDPOINT = "https://text.pollinations.ai/openai";
const TIMEOUT_MS = 12000;
const REFERRER = "cfc510-resume";

function setStatus(state, subsystem = "") {
  const el = document.querySelector("[data-status]");
  if (!el) return;
  el.textContent = state === "ok" ? "STATUS :: OK"
                 : state === "degraded" ? `STATUS :: DEGRADED — ${subsystem}`
                 : state;
  el.dataset.state = state;
}

// Stream from Pollinations /openai POST with SSE. Returns true if any
// content tokens made it to onToken, false on any failure.
async function streamPollinations(userPrompt, onToken, signal) {
  const body = {
    model: "openai",
    stream: true,
    referrer: REFERRER,
    seed: Math.floor(Math.random() * 1e9),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ],
  };
  let resp;
  try {
    resp = await fetch(ENDPOINT, {
      signal, method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
      body: JSON.stringify(body),
    });
  } catch (e) { return false; }
  if (!resp.ok || !resp.body) return false;

  const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let gotAny = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += value;
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (!payload || payload === "[DONE]") { if (payload === "[DONE]") return gotAny; continue; }
        try {
          const obj = JSON.parse(payload);
          // Pollinations/gpt-oss emits reasoning_content chunks during the
          // thinking phase — skip those, only stream actual content.
          const delta = obj.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            gotAny = true;
            onToken(delta);
          }
        } catch { /* ignore malformed chunk */ }
      }
    }
  } catch { /* stream aborted */ }
  return gotAny;
}

// Typewriter for the fallback path so it matches live streaming cadence.
async function typeString(s, onToken, cps = 45) {
  const delay = 1000 / cps;
  for (const ch of s) {
    onToken(ch);
    await new Promise(r => setTimeout(r, delay + (Math.random() * 10 - 5)));
  }
}

export async function ask(question, onToken) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), TIMEOUT_MS);
  const ok = await streamPollinations(question, onToken, ac.signal);
  clearTimeout(to);
  if (ok) { setStatus("ok"); return; }
  setStatus("degraded", "oracle");
  const canned = findTopic(question)
    ?? `The subject's resume covers flight-computer architecture, radiation tolerance, AI at the edge, FPGA acceleration, and autonomous vehicle software. Ask about any of those — VHDL, Yocto, CFC510/600, ROCm, Versal, AUV — and the oracle has something concrete.`;
  await typeString(canned, onToken);
}

export async function narrate(onToken) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), TIMEOUT_MS);
  const prompt = "Narrate one concrete, interesting technical detail about the subject's flight-computer or AUV work in 2-4 sentences. Pick something specific — ROCm on space silicon, software TMR, the TFLite GPU delegate, the AUV vision stack, the IDS, the BIOS work. Do not list multiple topics. One vivid paragraph.";
  const ok = await streamPollinations(prompt, onToken, ac.signal);
  clearTimeout(to);
  if (ok) { setStatus("ok"); return; }
  setStatus("degraded", "oracle");
  await typeString(pickMonologue(), onToken);
}
