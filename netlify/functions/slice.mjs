// netlify/functions/slice.mjs
// GET /api/slice?job=565          → returns metadata (no payload) if no PIN
// GET /api/slice?job=565&pin=1234 → validates PIN, returns payload if correct

import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  const url = new URL(req.url);
  const jobNum = url.searchParams.get("job");
  const pin    = url.searchParams.get("pin");

  if (!jobNum) {
    return new Response(JSON.stringify({ error: "Missing job parameter" }), { status: 400 });
  }

  const store = getStore("job-slices");
  let record;
  try {
    record = await store.get(`slice-${jobNum}`, { type: "json" });
  } catch {
    record = null;
  }

  if (!record) {
    return new Response(JSON.stringify({ error: "Job slice not found. Ask your PM to publish a new slice." }), { status: 404 });
  }

  // No PIN supplied → return metadata only (used by slice.html to show PIN screen)
  if (!pin) {
    return new Response(JSON.stringify({
      exists: true,
      jobNum: record.jobNum,
      published: record.published,
      pinHash: null  // never expose hash without PIN
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Validate PIN by re-hashing with same salt
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin + jobNum);
  const hashBuffer = await crypto.subtle.digest("SHA-256", pinData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);

  if (computedHash !== record.pinHash) {
    return new Response(JSON.stringify({ error: "Incorrect PIN" }), { status: 403 });
  }

  // PIN correct → return full payload + pinHash for session storage
  return new Response(JSON.stringify({
    payload: record.payload,
    pinHash: record.pinHash,
    published: record.published
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export const config = { path: "/api/slice" };
