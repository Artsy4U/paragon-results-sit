// netlify/functions/blobs.mjs
// POST /api/blobs  — superintendent saves look-ahead rows for a week
//   Body: { week: "YYYY-MM-DD", super: "jared", rows: [{sec,jobRef,jn,pn,crew,days:[...15]}] }
//
// GET  /api/blobs?week=YYYY-MM-DD&super=jared  — load one super's rows
// GET  /api/blobs?week=YYYY-MM-DD              — load ALL supers' rows for that week (PM rollup)

import { getStore } from "@netlify/blobs";

function storeKey(week, superName) {
  return `lookahead-${week}-${superName.toLowerCase().trim()}`;
}

export default async function handler(req) {
  const store = getStore("lookahead");

  // ── POST: save ──────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { week, super: superName, rows } = body;
    if (!week || !superName || !Array.isArray(rows)) {
      return json({ error: "Missing week, super, or rows" }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
      return json({ error: "week must be YYYY-MM-DD" }, 400);
    }

    const key = storeKey(week, superName);
    const record = {
      week,
      super: superName,
      savedAt: new Date().toISOString(),
      rows
    };

    try {
      await store.setJSON(key, record);
    } catch (e) {
      return json({ error: "Storage failed: " + e.message }, 500);
    }

    // Also maintain an index of supers who have saved for this week
    const indexKey = `index-${week}`;
    let index = [];
    try { index = (await store.get(indexKey, { type: "json" })) || []; } catch { index = []; }
    const nameNorm = superName.toLowerCase().trim();
    if (!index.includes(nameNorm)) {
      index.push(nameNorm);
      await store.setJSON(indexKey, index);
    }

    return json({ ok: true, week, super: superName, count: rows.length });
  }

  // ── GET: load ───────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const url   = new URL(req.url);
    const week  = url.searchParams.get("week");
    const sup   = url.searchParams.get("super");

    if (!week) return json({ error: "Missing week parameter" }, 400);

    // Single super load
    if (sup) {
      const key = storeKey(week, sup);
      let record;
      try { record = await store.get(key, { type: "json" }); } catch { record = null; }
      if (!record) return json({ rows: [], week, super: sup });
      return json({ ok: true, week, super: sup, savedAt: record.savedAt, rows: record.rows });
    }

    // All supers for this week (PM rollup view)
    const indexKey = `index-${week}`;
    let index = [];
    try { index = (await store.get(indexKey, { type: "json" })) || []; } catch { index = []; }

    if (index.length === 0) return json([], 200, true); // bare array for rollup compat

    const allRows = [];
    await Promise.allSettled(
      index.map(async name => {
        try {
          const rec = await store.get(storeKey(week, name), { type: "json" });
          if (rec && Array.isArray(rec.rows)) {
            rec.rows.forEach(r => allRows.push({ ...r, _super: name }));
          }
        } catch { /* skip missing */ }
      })
    );

    return json(allRows, 200, true); // bare array — rollup mapper handles this
  }

  return json({ error: "Method not allowed" }, 405);
}

function json(body, status = 200, bare = false) {
  return new Response(
    bare ? JSON.stringify(body) : JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    }
  );
}

export const config = { path: "/api/blobs" };
