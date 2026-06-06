// netlify/functions/list-reports.mjs
// GET /api/list-reports
// Returns metadata for all 7 slots — no binary data, fast response
// Dashboard calls this first to see what's available before fetching individual files

import { getStore } from "@netlify/blobs";

const SLOTS = ['wip','505','act','ct','520','pc10021','pvb'];

export default async function handler(req) {
  const store = getStore("reports");
  const result = {};

  await Promise.allSettled(
    SLOTS.map(async slot => {
      try {
        const meta = await store.get(`report-${slot}-meta`, { type: "json" });
        result[slot] = meta
          ? { filename: meta.filename, mimeType: meta.mimeType, uploadedAt: meta.uploadedAt, size: meta.size }
          : null;
      } catch {
        result[slot] = null;
      }
    })
  );

  return new Response(JSON.stringify({ ok: true, slots: result }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"   // always fresh — uploads can happen at any time
    }
  });
}

export const config = { path: "/api/list-reports" };
