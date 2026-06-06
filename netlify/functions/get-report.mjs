// netlify/functions/get-report.mjs
// GET /api/get-report?slot=pc10021
// Returns { slot, filename, mimeType, uploadedAt, size, data (base64) }
// No auth required for reads — reports are internal operational data, not sensitive

import { getStore } from "@netlify/blobs";

const VALID_SLOTS = ['wip','505','act','ct','520','pc10021','pvb'];

export default async function handler(req) {
  const url = new URL(req.url);
  const slot = url.searchParams.get("slot");

  if (!slot || !VALID_SLOTS.includes(slot)) {
    return new Response(JSON.stringify({ error: "Missing or invalid slot" }), { status: 400 });
  }

  const store = getStore("reports");

  let meta, binBuffer;
  try {
    meta = await store.get(`report-${slot}-meta`, { type: "json" });
  } catch {
    meta = null;
  }

  if (!meta) {
    return new Response(JSON.stringify({ error: `No report found for slot '${slot}'. Upload it via the admin page.` }), { status: 404 });
  }

  try {
    binBuffer = await store.get(`report-${slot}-bin`, { type: "arrayBuffer" });
  } catch {
    return new Response(JSON.stringify({ error: "Binary data missing — re-upload this slot." }), { status: 404 });
  }

  // Convert ArrayBuffer → base64
  const base64 = Buffer.from(binBuffer).toString('base64');

  return new Response(JSON.stringify({
    ok: true,
    slot,
    filename: meta.filename,
    mimeType: meta.mimeType,
    uploadedAt: meta.uploadedAt,
    size: meta.size,
    data: base64
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export const config = { path: "/api/get-report" };
