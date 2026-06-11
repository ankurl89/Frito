// One-off: background-remove the 6 garment templates → transparent cutouts.
// Keeps identical dimensions/position so calibrated print areas stay valid.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter(Boolean).filter(l => !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const FAL_KEY = env.FAL_KEY;
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const TPL = `${SUPA_URL}/storage/v1/object/public/product-assets/_templates`;

const FILES = ["tshirt.png", "tshirt-back.png", "hoodie.png", "hoodie-back.png", "sweatshirt.png", "sweatshirt-back.png"];

async function falRun(model, input) {
  const submit = await (await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })).json();
  if (!submit.request_id) throw new Error("submit failed: " + JSON.stringify(submit));
  const statusUrl = submit.status_url || `https://queue.fal.run/${model}/requests/${submit.request_id}/status`;
  const respUrl = submit.response_url || `https://queue.fal.run/${model}/requests/${submit.request_id}`;
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const st = await (await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })).json();
    if (st.status === "COMPLETED") break;
    if (st.status === "FAILED" || st.error) throw new Error("fal failed: " + JSON.stringify(st));
  }
  const out = await (await fetch(respUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })).json();
  const url = out.image?.url || out.images?.[0]?.url;
  if (!url) throw new Error("no image: " + JSON.stringify(out));
  return url;
}

async function upload(file, buf) {
  const path = `_templates/${file}`;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/product-assets/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SVC}`, "Content-Type": "image/png", "x-upsert": "true", "cache-control": "31536000" },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${file} failed: ${res.status} ${await res.text()}`);
  return `${SUPA_URL}/storage/v1/object/public/product-assets/${path}`;
}

for (const f of FILES) {
  const cutName = f.replace(/\.png$/, "-cut.png");
  process.stdout.write(`cutout ${f} → ${cutName} … `);
  const url = await falRun("fal-ai/birefnet", { image_url: `${TPL}/${f}` });
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const pub = await upload(cutName, buf);
  console.log(`done → ${pub}`);
}
console.log("All 6 cutouts generated.");
