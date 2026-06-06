# PARAGON TOOL MANIFEST

**Purpose.** One-row-per-tool registry of everything built in code sessions, so the tools are captured as knowledge on both sides of the Claude environment (Claude Code via `CLAUDE.md`, Claude.ai via Project knowledge). Pairs with `PARAGON_ENGINE_LIBRARY.md`. Source of truth is the single-folder Netlify repo; this file just indexes it.

**How to use.** To rebuild or extend any tool, say its rebuild trigger. All tools are self-contained, plain JS / HTML, no build step, deployed by drag-to-Netlify.

---

## INDEX (pin one line in memory edits)

> **Paragon Tool Manifest** (PARAGON_TOOL_MANIFEST.md / repo + project knowledge). Live at paragontulsaresults.com. Tools: WIP Dashboard (v12 prod / v13 dev), ODOT Price History, Production Factor Calc, HB-Vista Three-Way Compare v2, HB Variance Memo Generator v2, Go/No-Go Scorecard, Look-Ahead Roll-Up, Amortization Calc (personal), Presumptive Pricing Engine (build). Rebuild triggers in manifest file.

| Tool | File | URL | Status | Rebuild trigger |
|---|---|---|---|---|
| WIP Dashboard | paragon_wip_v12.html / paragon_wip_v13.html | paragontulsaresults.com | v12 Prod / v13 Dev | "Resume WIP Dashboard v13" |
| ODOT Price History | odot_price_history_with_pdf_loader.html | odot.paragontulsaresults.com | Live | resume from saved file |
| Production Factor Calculator | Paragon_ProductionFactor_Calculator.html | hub-linked | Live | "Rebuild Production Factor Calculator" |
| HB-Vista Three-Way Compare v2 | hb_vista_3way_compare_v2.html | hub-linked | Live | "Rebuild HB-Vista Three-Way Compare" |
| HB Variance Memo Generator v2 | hb_heavyjob_variance_memo_generator_v2.html | hub-linked | Live | "Rebuild HB Variance Memo Generator" |
| Go/No-Go Scorecard | go_nogo_scorecard.html | hub-linked | Live | resume from saved file |
| Look-Ahead Roll-Up | lookahead_rollup_v2.html | hub-linked | Live | "Resume Look-Ahead tool" |
| Amortization Calculator | amortization_schedule.html | Netlify Drop | Live (personal) | "Rebuild amortization calculator" |
| Presumptive Pricing Engine | index.html / app.js / core/price.js | — | In build | "Resume Presumptive Pricing Engine build — start with the skeleton" |
| Hub | index.html | paragontulsaresults.com | Live | — |

---

## 1. WIP DASHBOARD
- **Files:** `paragon_wip_v12.html` (prod beta), `paragon_wip_v13.html` (dev), `slice.html`, `netlify/functions/publish-slice.mjs`, `netlify/functions/slice.mjs`
- **URL:** paragontulsaresults.com (v12 live)
- **Purpose.** Earned-value WIP from Vista reports. 7-slot CSV/XLSX loader (F1–F7). Anchors: F1 (JC Contract Profit w/COs), F6 (PC Job Summation 10021 — cost anchor, captures .888/.999/.777 health phases), F7 (JC Progress vs Billed — billing anchor). F6 must always be present; Report 490 is blind to health phases.
- **v13 adds.** Publish Slice — job-row button → PIN modal → `/api/publish-slice` → Netlify Blobs; `slice?job=NNN` PIN-gated, 3 tabs (Cost Drivers / Action Items / All Phases). Needs `@netlify/blobs` + paid tier.
- **Save Snapshot** resolved via `fetch(window.location.href)` + `<script type="text/plain">` source baking.
- **Open.** Deploy v13, test slice E2E, build Billing Verification tab, SEFL drill.
- **Edit rule.** Surgical Python string-replacement, not full rewrites; validate brace balance before copying to outputs.
- **Rebuild trigger.** "Resume WIP Dashboard v13"

## 2. ODOT PRICE HISTORY
- **File:** `odot_price_history_with_pdf_loader.html`
- **URL:** odot.paragontulsaresults.com
- **Purpose.** Lookup over 11,840 ODOT price records (Jul 2024–Dec 2025). pako.js decompression of bundled dataset; PDF drag-drop loader to pull pay-item quantities.
- **Notes.** Isolated subdomain by design. Seeds the Presumptive Pricing Engine's price-history layer.
- **Rebuild trigger.** Resume from saved file.

## 3. PRODUCTION FACTOR CALCULATOR
- **File:** `Paragon_ProductionFactor_Calculator.html`
- **Purpose.** Generic (no job refs). Inputs: units (HeavyJob), daily output (HeavyBid UPS), factor slider 0.10–1.50. Outputs: baseline/forecast duration, delta, curve chart, sensitivity table. Download bakes current state → auto-prints in Chrome/Edge.
- **Rebuild trigger.** "Rebuild Production Factor Calculator"

## 4. HB-VISTA THREE-WAY COMPARE v2
- **File:** `hb_vista_3way_compare_v2.html`
- **Purpose.** Reconcile HeavyBid / Vista / prior recon. File1 = Viewpoint CSV, File2 = JCCostEstCT, File3 = prior recon. Join = phase suffix → int.
- **Pairs with.** Pre-Import Validation Engine, Unit-of-Measure Recon Engine.
- **Rebuild trigger.** "Rebuild HB-Vista Three-Way Compare"

## 5. HB VARIANCE MEMO GENERATOR v2
- **File:** `hb_heavyjob_variance_memo_generator_v2.html`
- **Purpose.** Offline memo generator for HeavyBid→HeavyJob import variances (symbol bug fixed). Canonical template: `575_-_SGL_HB_HeavyJob_Variance_Memo.docx`.
- **Pairs with.** Pre-Import Validation Engine.
- **Rebuild trigger.** "Rebuild HB Variance Memo Generator"

## 6. GO/NO-GO SCORECARD
- **File:** `go_nogo_scorecard.html`
- **Purpose.** 10 criteria, 0/1/2 scale (max 20). 14–20 = Bid, 8–13 = CEO Decides, 0–7 = No Bid. Gate questions on Q1–Q3. Targets: ODOT road/highway, municipal streets, FAA airport, private dirt; sweet spot $2M–$5M.
- **Open.** Calibration with Dale/Tyler.
- **Rebuild trigger.** Resume from saved file.

## 7. LOOK-AHEAD ROLL-UP
- **File:** `lookahead_rollup_v2.html`
- **Purpose.** Roll up field schedules. Paragon palette, responsive 860px, SheetJS CDN. Semantic parser: CREW header → date row (3+ dates) → activity col → skips summary rows. Sheet detect: Pass1 exact names, Pass2 not-in-bad-list, Pass3 any schedule.
- **Open.** Formula-driven `' Schedule'` tabs read as raw tokens by XLSX.js.
- **Rebuild trigger.** "Resume Look-Ahead tool"

## 8. AMORTIZATION CALCULATOR (personal)
- **File:** `amortization_schedule.html`
- **URL:** Netlify Drop
- **Purpose.** Personal loan tool. Inputs: loan, buy-down/down payment, rate (supports zero-interest), payment (default $300), extra payment, monthly/bi-weekly toggle. Outputs: payoff duration, period table, CSV export.
- **Note.** Personal, not a Paragon work tool — keep separate from the work project if desired.
- **Rebuild trigger.** "Rebuild amortization calculator"

## 9. PRESUMPTIVE PRICING ENGINE (in build)
- **Files:** `index.html`, `app.js`, `core/price.js` (plain JS ES modules, no build step)
- **Purpose.** Consolidate ODOT price history + PDF quantity extraction + pre-markup bid totaling. Kickoff brief complete (`Presumptive_Pricing_Module_Consolidation_Brief.md`); next step is the three-file skeleton.
- **Rebuild trigger.** "Resume Presumptive Pricing Engine build — start with the skeleton"

## 10. HUB
- **File:** `index.html`
- **URL:** paragontulsaresults.com
- **Purpose.** Landing index with relative links to all tools. Single-folder Netlify deploy.

---

## DEPLOYMENT DISCIPLINE (standing rules)
- Single-folder Netlify drag-and-drop. No build steps. No subdomains per tool unless isolated by design (ODOT is intentional).
- Plain JS ES modules for new tools. No TypeScript / bundlers.
- Self-contained HTML where possible; CDN for SheetJS / pako.
