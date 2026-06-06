// netlify/functions/blobs.mjs
//
// POST /api/blobs
//   Body: { week, super, rows, store? }
//   store = "lookahead" (super entries, default) | "crew" (crew-level entries)
//
// GET  /api/blobs?week=YYYY-MM-DD&super=name[&store=crew]  — one person
// GET  /api/blobs?week=YYYY-MM-DD[&store=crew]             — all for that week

import { getStore } from "@netlify/blobs";

const VALID_STORES = ["lookahead", "crew"];

function resolveStore(storeName) {
  return VALID_STORES.includes(storeName) ? storeName : "lookahead";
}

function entryKey(week, name) {
  return `entry-${week}-${name.toLowerCase().trim()}`;
}

function indexKey(week) {
  return `index-${week}`;
}

export default async function handler(req) {

  // ── POST: save ──────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { week, super: personName, rows, store: storeParam } = body;
    if (!week || !personName || !Array.isArray(rows)) {
      return json({ error: "Missing week, super, or rows" }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
      return json({ error: "week must be YYYY-MM-DD" }, 400);
    }

    const storeName = resolveStore(storeParam);
    const store     = getStore(storeName);
    const nameNorm  = personName.toLowerCase().trim();
    const record    = { week, name: nameNorm, savedAt: new Date().toISOString(), rows };

    try {
      await store.setJSON(entryKey(week, nameNorm), record);
    } catch (e) {
      return json({ error: "Storage failed: " + e.message }, 500);
    }

    // Maintain week index
    let index = [];
    try { index = (await store.get(indexKey(week), { type: "json" })) || []; } catch { index = []; }
    if (!index.includes(nameNorm)) {
      index.push(nameNorm);
      await store.setJSON(indexKey(week), index);
    }

    return json({ ok: true, week, super: nameNorm, store: storeName, count: rows.length });
  }

  // ── GET: load ───────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const url       = new URL(req.url);
    const week      = url.searchParams.get("week");
    const person    = url.searchParams.get("super");
    const storeName = resolveStore(url.searchParams.get("store"));
    const store     = getStore(storeName);

    if (!week) return json({ error: "Missing week parameter" }, 400);

    // Single person
    if (person) {
      let record;
      try { record = await store.get(entryKey(week, person), { type: "json" }); } catch { record = null; }
      if (!record) return json({ rows: [], week, super: person, store: storeName });
      return json({ ok: true, week, super: person, store: storeName, savedAt: record.savedAt, rows: record.rows });
    }

    // All entries for this week
    let index = [];
    try { index = (await store.get(indexKey(week), { type: "json" })) || []; } catch { index = []; }
    if (index.length === 0) return json([], 200, true);

    const allRows = [];
    await Promise.allSettled(
      index.map(async name => {
        try {
          const rec = await store.get(entryKey(week, name), { type: "json" });
          if (rec && Array.isArray(rec.rows)) {
            rec.rows.forEach(r => allRows.push({ ...r, _by: name, _store: storeName }));
          }
        } catch { /* skip */ }
      })
    );

    return json(allRows, 200, true);
  }

  return json({ error: "Method not allowed" }, 405);
}

function json(body, status = 200, bare = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
  });
}

export const config = { path: "/api/blobs" };
