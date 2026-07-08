# Match Highlights banner — LEGO-style, auto-minted after each big match

A banner at the very top of the app (between the header and the what's-new
billboard) that shows the latest big result — headline, scoreline, one-line
story — over an AI-generated LEGO-brick diorama of the moment. A new card is
minted automatically after each knockout match finishes.

## Data contract (Supabase `kv`)

The frontend is a **pure renderer**; all copy and the image come from two keys:

- **`wc:highlight`** — JSON:
  ```json
  {
    "v": 1,
    "id": "k23",                      // fixture id the card is about
    "round": "Round of 16",           // chip text, e.g. "Quarter-final"
    "home": "Argentina", "away": "Egypt", "h": 3, "a": 2,
    "headline": "Argentina survive a five-goal thriller",
    "score": "Argentina 3–2 Egypt",   // scoreline text (append "(4–2 pens)" etc.)
    "sub": "one-line story + what's next",
    "ts": "2026-07-08T01:35:00Z",     // identity of the card — bump to re-show to dismissers
    "img": "https://…webp"            // optional https image URL (Higgsfield CDN)
  }
  ```
- **`wc:highlight_img`** — optional fallback: a `data:image/webp;base64,…` URI
  (~100 KB). Used only when `wc:highlight.img` is absent. Keeps the feature
  self-contained if CDN hot-linking ever becomes unreliable.

`kv` is world-readable (`kv_read_all`), so no policy changes were needed.
Writes are server-side only (RLS): the automation writes with service-level
SQL; an organizer can hand-write `wc:highlight` through the usual `org_exec`
path (`orgSet('wc:highlight', {...})` from the console of an organizer
session) — e.g. for a "biggest news" card that isn't a match result.

## Frontend (index.html)

- Markup `#hlban` right below `</header>`; CSS `.hlban` block next to the
  `.xbanner` styles; JS `renderHighlight`/`refreshHighlight`/`hlDismiss` next
  to the xbanner functions.
- Boot calls `refreshHighlight(true)` after `setupBanner()` — it reads its own
  keys and never blocks boot; the image lazy-loads after the card is up and
  fades in only once decoded.
- `refreshResults()` calls `refreshHighlight(true)` when a new final folds in,
  so an open tab picks up the fresh card within the same polling cadence.
- Dismiss (✕) remembers `wc:highlight.ts` in localStorage (`wc:hl_seen`);
  the next card (new `ts`) shows again.
- Degradation: no `wc:highlight` → banner hidden; image fetch fails → card
  still shows text over the gold gradient.

## Automation

A scheduled Claude routine (hourly, `7 * * * *`) owned by the organizer's
Claude session does, each run:

1. Read `kv('wc:results')` + `wc_ko_sched`/`wc_alias` and find knockout
   matches that are final but newer than the current `wc:highlight.id/ts`.
2. Pick the most highlight-worthy new final (later round > goals > penalty
   drama > upset).
3. Write the copy (headline / score / sub — factual: score, round, who's next,
   from bracket feeders; no invented match events).
4. Generate the LEGO scene with Higgsfield (`nano_banana_pro`, 16:9, macro toy
   photography of a brick stadium; winner's kit celebrating, loser's kit
   dejected; explicit "no text/logos" — text lives in the HTML overlay).
5. Upsert `wc:highlight` with the CDN `_min.webp` URL (service-level SQL).
6. After the final (k32) card is minted, the routine disables itself.

Costs ~6 Higgsfield credits per match on the organizer's account.

## Ops notes

- Kill switch: `delete from kv where key = 'wc:highlight';` (or `orgDel`) —
  banner disappears everywhere within a minute.
- Force re-show after editing copy: change `ts`.
- The Higgsfield CDN serves `cache-control: immutable, max-age=1y`; each card
  only needs to live a few days, and the hourly run re-checks the current
  image URL still resolves.
