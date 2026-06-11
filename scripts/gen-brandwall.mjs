// One-off: generate 4 apparel brand-wall images via fal Flux, upload to Supabase.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter(Boolean).filter(l => !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const FAL_KEY = env.FAL_KEY;
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;

const COMMON =
  "premium editorial apparel brand lifestyle photo, real model wearing the garment, " +
  "natural soft light, shot on 35mm, muted premium color grade, high detail, " +
  "minimal background, fashion lookbook, no text, no logo, no watermark";

const JOBS = [
  { file: "bw-gaming.jpg",  prompt: `young gamer wearing a black oversized graphic t-shirt, neon-lit room bokeh, ${COMMON}` },
  { file: "bw-startup.jpg", prompt: `confident founder wearing a clean navy crewneck sweatshirt with subtle minimal branding, bright modern office, ${COMMON}` },
  { file: "bw-cause.jpg",   prompt: `person wearing a beige organic cotton t-shirt with an embroidered nature motif, outdoor greenery, warm natural light, ${COMMON}` },
  { file: "bw-anime2.jpg",  prompt: `stylish person wearing a premium white heavyweight tee with a bold minimal anime-inspired back print, tokyo street at dusk, ${COMMON}` },
];

async function falGenerate(prompt) {
  // Submit to queue
  const submit = await fetch("https://queue.fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image_size: "square_hd", num_images: 1, num_inference_steps: 28, enable_safety_checker: true }),
  });
  const sub = await submit.json();
  if (!sub.request_id) throw new Error("submit failed: " + JSON.stringify(sub));
  const statusUrl = sub.status_url || `https://queue.fal.run/fal-ai/flux/dev/requests/${sub.request_id}/status`;
  const respUrl = sub.response_url || `https://queue.fal.run/fal-ai/flux/dev/requests/${sub.request_id}`;
  // Poll
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const st = await (await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })).json();
    if (st.status === "COMPLETED") break;
    if (st.status === "FAILED" || st.error) throw new Error("fal failed: " + JSON.stringify(st));
  }
  const out = await (await fetch(respUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })).json();
  const url = out.images?.[0]?.url;
  if (!url) throw new Error("no image: " + JSON.stringify(out));
  return url;
}

async function upload(file, buf) {
  const path = `_home/${file}`;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/product-assets/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SVC}`, "Content-Type": "image/jpeg", "x-upsert": "true", "cache-control": "31536000" },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${file} failed: ${res.status} ${await res.text()}`);
  return `${SUPA_URL}/storage/v1/object/public/product-assets/${path}`;
}

for (const j of JOBS) {
  process.stdout.write(`generating ${j.file}… `);
  const imgUrl = await falGenerate(j.prompt);
  const buf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
  const pub = await upload(j.file, buf);
  console.log(`done → ${pub}`);
}
console.log("All 4 brand-wall images generated.");
