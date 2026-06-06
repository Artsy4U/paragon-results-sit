// netlify/functions/publish-slice.mjs
// Accepts: { jobNum, pin, payload }
// Stores payload in Netlify Blobs under key "slice-{jobNum}"
// PIN is hashed with SHA-256 before storage

import { getStore } from "@netlify/blobs";

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

  const { jobNum, pin, payload } = body;

  if (!jobNum || !pin || !payload) {
    return new Response(JSON.stringify({ error: "Missing jobNum, pin, or payload" }), { status: 400 });
  }

  if (!/^\d{4}$/.test(pin)) {
    return new Response(JSON.stringify({ error: "PIN must be exactly 4 digits" }), { status: 400 });
  }

  // Hash the PIN with SHA-256
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin + jobNum); // salt with jobNum
  const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const pinHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);

  // Store to Netlify Blobs
  const store = getStore("job-slices");
  const record = {
    pinHash,
    payload,
    published: new Date().toISOString(),
    jobNum
  };

  try {
    await store.setJSON(`slice-${jobNum}`, record);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Storage failed: " + e.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, jobNum, pinHash }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export const config = { path: "/api/publish-slice" };
