// netlify/functions/upload-report.mjs
// POST /api/upload-report
// Body: { slot, pin, filename, mimeType, data (base64) }
// Validates ADMIN_PIN env var, stores binary + metadata in Netlify Blobs

import { getStore } from "@netlify/blobs";

const VALID_SLOTS = ['wip','505','act','ct','520','pc10021','pvb'];

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const { slot, pin, filename, mimeType, data } = body;

  if (!slot || !pin || !filename || !data) {
    return new Response(JSON.stringify({ error: "Missing slot, pin, filename, or data" }), { status: 400 });
  }

  if (!VALID_SLOTS.includes(slot)) {
    return new Response(JSON.stringify({ error: "Invalid slot. Must be one of: " + VALID_SLOTS.join(', ') }), { status: 400 });
  }

  // Validate admin PIN
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return new Response(JSON.stringify({ error: "Server not configured (ADMIN_PIN missing)" }), { status: 500 });
  }
  if (pin !== adminPin) {
    return new Response(JSON.stringify({ error: "Incorrect PIN" }), { status: 403 });
  }

  // Decode base64 → Buffer
  let buffer;
  try {
    buffer = Buffer.from(data, 'base64');
  } catch {
    return new Response(JSON.stringify({ error: "Invalid base64 data" }), { status: 400 });
  }

  const store = getStore("reports");
  const uploadedAt = new Date().toISOString();

  try {
    // Store raw binary
    await store.set(`report-${slot}-bin`, buffer);

    // Store metadata separately (fast to read for list endpoint)
    await store.setJSON(`report-${slot}-meta`, {
      slot,
      filename,
      mimeType: mimeType || 'application/octet-stream',
      uploadedAt,
      size: buffer.length
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Storage failed: " + e.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, slot, filename, uploadedAt, size: buffer.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export const config = { path: "/api/upload-report" };
