# SPEC: Mystery Figure Trivia Game (Sprint 2)
## 1. Purpose & Scope
- A single-player browser trivia game for an individual history enthusiast. Each round
picks a random figure from a fixed list and reveals hand-written clues one at a time
until the player guesses who it is or runs out of clues.
- Core workflow: Start round -> read clue -> submit guess -> (wrong: next clue / right:
round ends) -> view reveal -> start next round.
- Sprint 2 moves all game data and game rules from the browser to a Flask backend on `localhost:5000`, first with in-memory Python structures (Phase 1), then with SQLite persistence (Phase 2). The Sprint 1 frontend is rewired to the backend with `fetch()`.
- Non-Goals: no real LLM API calls (guess matching stays a mock, now server-side); no user accounts, leaderboards, or sharing; no adding or editing figures from the UI; no deployment beyond localhost.

## 2. Invariants & Negative Constraints
- The frontend MUST consist of `./frontend/index.html`, `./frontend/style.css`, and `./frontend/app.js`.
- All styling MUST reside in `./style.css` (no inline style="..." attributes).
- The page MUST NOT load external CSS frameworks or CDNs (no Bootstrap, no Tailwind).
- style.css MUST begin with the universal reset: `*, *::before, *::after { box-sizing:
border-box; }`.
- Spacing and font sizes MUST use rem. px MAY be used only for borders.
- Colors MUST be defined as CSS custom properties on `:root` (e.g. `--accent`,
`--correct`, `--incorrect`, `--surface`).
- Styling MUST use class selectors. ID selectors MUST NOT be used for styling; IDs exist
only as JavaScript hooks.
- All JavaScript MUST live in ./app.js. index.html MUST NOT contain inline onclick
attributes or any <script> block with code inside it.
- app.js MUST be loaded from <head> with <script src="./app.js" defer></script>.
- Showing and hiding MUST be done by adding and removing a CSS class. app.js MUST NOT set
styles directly through .style, EXCEPT the progress bar width, which MAY be set through
a CSS custom property (`--progress`) using `style.setProperty`.
- style.css MUST define .hidden { display: none; }.
- The layout MUST collapse into a single vertical column on screens narrower than 768px.
- Figure data MUST live in `backend/seed_figures.json` with at least 5 figures from different eras and fields. app.js MUST NOT contain a `FIGURES` array, clue text, figure names, or a guess matcher.
- Every figure MUST have exactly 6 clues (ordered hardest to easiest) and a 2–4 sentence
reveal.
- All network calls in app.js MUST go through one helper, `apiRequest(method, path, body)`, which returns `{ status, data }` and never throws on HTTP error codes.
- The console MUST show no errors at any point in the workflow.

## 3. UI Content & Interface Contract
### 3.1 Data Contract
- Each figure MUST follow this shape:
```js
{
  id: "julius-caesar",
  name: "Julius Caesar",
  clues: ["...", "...", "...", "...", "...", "..."], // exactly 6, hardest first
  reveal: "Julius Caesar (100–44 BC) was a Roman general and statesman...",
  mockAliases: ["caesar", "gaius julius caesar"]     // Sprint 1 only
}
```
- Each completed round MUST be stored in memory as
`{ figureId, guesses, cluesUsed, correct, score, timestamp }`.

### 3.2 Page Structure
- The page MUST use semantic landmarks: one <header>, one <main>, one <footer>, and each
content group inside its own <section> with a heading.
- There MUST be exactly one <h1> reading "Mystery Figure", and heading levels MUST NOT
skip (h1 then h2 then h3).
- The <header> MUST show session stats: elements with id="stat-played",
id="stat-correct", and id="stat-streak".
- <main id="game"> MUST carry a `data-status` attribute with one of: "idle", "playing",
"checking", "won", "lost". Its initial value in the HTML MUST be "idle".
- On desktop, the game section and the history section MUST sit side by side in a CSS
Grid (2fr 1fr).
### Backend Invariants
- The backend MUST be a Flask application started with `python app.py`, running on `localhost:5000`.
- The only third-party dependency MUST be Flask, listed in `requirements.txt`. The database MUST use Python's built-in `sqlite3` module (no ORM).
- Code MUST be split by responsibility: `app.py` (routes and error handlers), `db.py` (connection, schema setup, seeding, queries), `matcher.py` (guess matching), and `schema.sql` (table definitions).
- Flask MUST also serve the frontend files from `/` so the page and API share one origin. CORS MUST NOT be needed.
- The database MUST contain at most two tables: `figures` and `rounds`.
- Every route MUST return JSON (except the 204 response, which has no body) and MUST return an explicit status code.
- Every error response MUST use this shape: `{"error": {"code": "<snake_case_code>", "message": "<human-readable text>", "field": "<field name or null>"}}`.
- Request bodies MUST be read with `request.get_json(silent=True)` and fields with `.get()`. A missing or non-JSON body MUST return 400, never 500.
- String inputs MUST be type-checked with `isinstance(value, str)` and stripped before validation.
- Values MUST be stored with their real types: integers for IDs, counts, and scores; booleans in API responses for flags such as `match` and `correct`; JSON text in SQLite only for list columns (`clues_json`, `aliases_json`, `guesses_json`).
- All SQL MUST use `?` placeholders. Queries MUST NOT be built with string formatting or concatenation.
- The app MUST run with `debug=False` in the submitted version, and a catch-all error handler MUST turn unhandled exceptions into a JSON 500 response with no stack trace.
- While a round is "playing", no response MAY include the figure's name, aliases, reveal text, or any clue that has not been revealed yet.
- `matcher.py` MUST expose `check_guess(guess: str, figure: dict) -> bool`. Routes MUST call only this function to judge guesses, so the Sprint 3 LLM call can replace it without route changes.
- Game rules (clue limits, scoring, duplicate detection, win/loss) MUST be enforced on the server. The frontend MAY disable controls for convenience, but MUST NOT be the only check.
+
### Version Control
- Every meaningful change MUST be committed to Git. The submitted repository MUST NOT consist of a single commit.
- Commit messages MUST be imperative and describe what changed and why (e.g., "Add guess validation to return 400 on empty input").
- `mystery_figure.db`, `__pycache__/`, and virtual environment folders MUST be listed in `.gitignore`.
### 3.1 Data Contract
- Each figure in `seed_figures.json` MUST follow this shape:
```json
{
  "id": 1,
  "slug": "julius-caesar",
  "name": "Julius Caesar",
  "clues": ["...", "...", "...", "...", "...", "..."],
  "reveal": "Julius Caesar (100–44 BC) was a Roman general and statesman...",
  "aliases": ["caesar", "gaius julius caesar"]
}
```
- `id` MUST be a unique integer, and `slug` MUST be a unique lowercase, hyphenated string.
- `clues` MUST contain exactly 6 strings, ordered hardest to easiest.
- `reveal` MUST be 2–4 sentences.
- `aliases` MUST be a list of strings (it MAY be empty) and is used only by the
server-side matcher. It MUST NOT be sent to the frontend.
- Rounds MUST be stored on the server as described in 3.7 (Phase 1) and 3.8 (Phase 2).

### 3.2 Page Structure
- The page MUST use semantic landmarks: one <header>, one <main>, one <footer>, and each
content group inside its own <section> with a heading.
- There MUST be exactly one <h1> reading "Mystery Figure", and heading levels MUST NOT
skip (h1 then h2 then h3).
- The <header> MUST show session stats: elements with id="stat-played",
id="stat-correct", and id="stat-streak".
- <main id="game"> MUST carry a `data-status` attribute with one of: "idle", "playing",
"checking", "won", "lost". Its initial value in the HTML MUST be "idle".
- On desktop, the game section and the history section MUST sit side by side in a CSS
Grid (2fr 1fr).
### 3.3 Components
- Start panel: a <section id="start-panel"> with a short intro and a "Start Game" button,
visible only while data-status is "idle".
- Progress track: an element with id="progress" carrying `data-revealed` (0–6) and
`data-total="6"`, containing 6 dots and a fill bar, plus text reading "Clue X of 6".
- Clue list: an <ol id="clue-list"> where each revealed clue is an
<li class="clue-card">.
- Guess chips: a <ul id="guess-list"> where each wrong guess is an
<li class="chip chip--wrong">.
- Guess form: a <form id="guess-form"> with a text input id="guess-input",
maxlength="60", a <label> bound to it reading "Your guess", and a submit button
id="guess-btn" labelled "Guess".
- Skip button: a button id="skip-btn" labelled "Skip to next clue".
- Status message: a <p id="status-msg" aria-live="polite"> that gets the class `.is-error` when showing a server error.
- Reveal panel: a <section id="reveal-panel" class="hidden"> showing the figure's name,
reveal text, round score, and a "New Round" button.
- History list: a <section> with heading "Session History" containing <ul id="history-list">, where each completed round is an <li class="history-card"> with `data-round-id`, `data-figure-id`, `data-result="correct|incorrect"`, and a "Remove" button.
### 3.4 Behavior
- Clicking "Start Game" or "New Round" MUST call `POST /api/rounds`, and on 201 render the returned round (clue 1, empty guess list), set data-status to "playing", and hide the start and reveal panels.
- Figures MUST NOT repeat until every figure has been played, even across server restarts (enforced by the server).
- The "Guess" button MUST be disabled while the trimmed input is empty.
- Submitting an empty guess (e.g. with Enter) MUST show "Enter a name first." and MUST NOT send a request.
buttons, and show "Checking…" in the status message.
- Submitting an empty guess (e.g. with Enter) MUST show "Enter a name first." and MUST
NOT call checkGuess.
- Repeating a guess already made this round (case-insensitive) MUST be rejected by the server with 400 `duplicate_guess`; the UI MUST show "You already guessed that." and MUST NOT cost a clue.
- A wrong guess with clues remaining MUST add a wrong-guess chip, append the next clue
card, increment data-revealed, fill the next progress dot, widen the fill bar, and show
"Not quite! Here's another clue."
- Clicking "Skip to next clue" MUST reveal the next clue without adding a chip.
- The skip button MUST be disabled when all 6 clues are revealed.
- data-revealed MUST NOT exceed data-total.
- A correct guess MUST set data-status to "won", show the score returned by the server (7 − clues revealed), show the reveal panel with the "won" style, append a history card, and update the stats and streak.
- A wrong guess on clue 6 MUST set data-status to "lost", score 0, show the reveal panel
with the "lost" style, append a history card, update the stats, and reset the streak.
- In the "won" and "lost" states, the guess form and skip button MUST be disabled until
"New Round" is clicked.
- Buttons MUST have visually distinct :hover, :focus-visible, :active, and :disabled
states, and all four rules MUST live in style.css.
- New clue cards SHOULD animate in, and the progress fill width SHOULD transition
smoothly.
- On page load, the UI MUST call `GET /api/rounds` to render history and stats, then `GET /api/rounds/current`. If a round is "playing", it MUST resume on screen instead of showing the start panel.
- Clicking "Remove" on a history card MUST call `DELETE /api/rounds/<id>`. On 204, the card MUST be removed from the DOM and the stats refreshed.
- The DOM MUST always be rendered from the server's response, never from values the frontend calculated itself.
### 3.5 Mock Guess Matcher (`backend/matcher.py`)
- `normalize()` MUST lowercase, trim, strip accents (`unicodedata.normalize("NFD")`), remove punctuation, and collapse whitespace.
- `check_guess()` MUST return True if the normalized guess equals the normalized full name, the final word of the name (surname), or any normalized alias.
- The artificial delay is removed; the "checking" state now lasts for the length of the real request.
- Each check MUST be logged to the Flask terminal as the round ID, the guess, and the result.
### 3.6 File Structure
- /backend: app.py, db.py, matcher.py, schema.sql, seed_figures.json, requirements.txt
- /frontend: index.html, style.css, app.js
- Root: .gitignore, spec.md, SPRINT2.md

### 3.7 Phase 1: In-Memory Data Structures
- Before the database exists, `app.py` MUST hold `FIGURES` (a list of dicts loaded from seed_figures.json) and `ROUNDS` (a list of dicts).
- Each round dict MUST be: `{"id": int, "figure_id": int, "status": "playing"|"won"|"lost", "clues_revealed": int 1–6, "guesses": [str], "score": int or None, "created_at": str, "finished_at": str or None}`.
- Phase 1 routes MUST implement the full API in 3.9 against these lists.

### 3.8 Phase 2: SQLite Schema
- The database file MUST be `backend/mystery_figure.db`. `init_db()` MUST run `schema.sql` at startup using `CREATE TABLE IF NOT EXISTS`, and MUST seed `figures` only when the table is empty.
- `figures`: id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, clues_json TEXT NOT NULL, reveal TEXT NOT NULL, aliases_json TEXT NOT NULL DEFAULT '[]'.
- `rounds`: id INTEGER PRIMARY KEY AUTOINCREMENT, figure_id INTEGER NOT NULL REFERENCES figures(id), status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing','won','lost')), clues_revealed INTEGER NOT NULL DEFAULT 1 CHECK (clues_revealed BETWEEN 1 AND 6), guesses_json TEXT NOT NULL DEFAULT '[]', score INTEGER CHECK (score IS NULL OR score BETWEEN 0 AND 6), created_at TEXT NOT NULL, finished_at TEXT.
- Rows MUST be converted to dicts (via `sqlite3.Row`) and JSON columns decoded with `json.loads` before being returned.
- All rounds and figures MUST survive stopping the server with Ctrl+C and restarting it.

### 3.9 API Endpoints
- Round object: `{id, status, clues_revealed, total_clues: 6, clues: [revealed only], guesses, score, correct, figure, created_at, finished_at}`. While "playing", `score`, `correct`, and `figure` are null. When finished, `clues` holds all 6 and `figure` is `{slug, name, reveal}`.
- Stats object: `{played, correct, streak}`, where streak counts consecutive "won" rounds back from the most recently finished one.
- `GET /` → 200, serves index.html.
- `GET /api/rounds` → 200 `{"rounds": [...finished, newest first], "stats": {...}}`. (SELECT)
- `GET /api/rounds/current` → 200 `{"round": {...} or null}`. (SELECT)
- `GET /api/rounds/<int:id>` → 200 round; 404 `round_not_found`. (SELECT)
- `POST /api/rounds` → 201 round. (SELECT, UPDATE, INSERT)
- `POST /api/rounds/<int:id>/guesses` → 200 `{"match": bool, "round": {...}}`; 400; 404. (SELECT, UPDATE)
- `POST /api/rounds/<int:id>/skip` → 200 round; 400; 404. (SELECT, UPDATE)
- `DELETE /api/rounds/<int:id>` → 204 no body; 400; 404. (DELETE)

### 3.10 Server-Side Rules
- Starting a round: any round still "playing" MUST first be finished as "lost" with score 0. The new figure MUST be chosen at random among the figures with the fewest rounds played.
- Guess validation (400, in this order, none costs a clue): `invalid_body`; `invalid_guess` (missing or not a string); `empty_guess`; `guess_too_long` (over 60 characters); `round_finished`; `duplicate_guess`.
- Correct guess: status "won", score = 7 − clues_revealed, finished_at set.
- Wrong guess with clues_revealed < 6: guess appended, clues_revealed + 1.
- Wrong guess with clues_revealed = 6: guess appended, status "lost", score 0, finished_at set.
- Skip: 400 `round_finished` if not playing; 400 `no_more_clues` at 6; otherwise clues_revealed + 1.
- Delete: 404 if missing; 400 `round_in_progress` if playing; otherwise delete and return 204.
- Unknown `/api/...` paths MUST return a JSON 404 (`not_found`), and a wrong HTTP method a JSON 405 (`method_not_allowed`).

### 3.11 Error Feedback by Status Code
- 400 → show `error.message` in `#status-msg` with `.is-error`; if `error.field` is "guess", add `.input--invalid` to the guess input; re-enable controls. Both classes MUST be removed on the next input event.
- 404 → show "That round no longer exists. Start a new one." and return to the idle state.
- 500 or network failure → show "Something went wrong on the server. Please try again." and re-enable controls.
## 4. Acceptance Checklist
- [x] app.js is loaded from <head> with defer, and index.html has no inline onclick and
no code inside a <script> tag.
- [x] style.css begins with the box-sizing reset and uses no ID selectors.
- [x] app.js contains no .style assignments other than setting `--progress`.
- [x] Opening the page shows the start panel, stats at 0, and no red Console errors.
- [x] Clicking "Start Game" shows clue 1 and "Clue 1 of 6".
- [x] The "Guess" button stays disabled when the input is empty or only spaces.
- [x] A wrong guess shows "Checking…", then adds a chip and the next clue, and the
progress bar grows.
- [x] Repeating a wrong guess shows "You already guessed that." and adds no clue.
- [x] The skip button is disabled at "Clue 6 of 6".
- [x] A wrong guess on clue 6 shows the reveal panel in the "lost" style, adds a history
card, and resets the streak.
- [x] Entering only a figure's surname (e.g. "Caesar") is marked correct, and the
reveal panel shows the score.
- [x] After a round ends, the input and buttons are disabled until "New Round".
- [x] No figure repeats until every figure has been played, even across server restarts.
- [x] Every guess prints the round ID, guess, and match result in the Flask terminal.
- [x] At widths below 768px, the layout is a single column with no horizontal scroll.
- [x] `python app.py` starts the server on localhost:5000, and `http://localhost:5000` loads the game.
- [x] `POST /api/rounds` returns 201 with a round that shows exactly 1 clue and no figure name.
- [x] `GET /api/rounds/99999` returns 404 with the error JSON shape.
- [x] Posting `{}`, `{"guess": ""}`, `{"guess": 42}`, or a 61-character guess returns 400 with the right error code and field.
- [x] Posting a guess to a finished round returns 400 `round_finished`; skipping at 6 clues returns 400 `no_more_clues`.
- [x] Deleting a finished round returns 204; deleting a playing round returns 400.
- [x] An unknown `/api/` path returns a JSON 404, and a forced exception returns a JSON 500 with no stack trace.
- [x] No API response for a "playing" round contains the figure's name or unrevealed clues (check the Network tab).
- [x] After playing 3 rounds, Ctrl+C and restarting the server keeps all 3 rounds and the same stats.
- [x] Refreshing the page mid-round resumes the same round with the same clues and guesses.
- [x] app.js contains no figure data, clue text, or matcher code.
- [x] A duplicate guess shows the server's message, highlights the input, and costs no clue.
- [x] Clicking "Remove" on a history card removes it and updates the stats.
- [x] With the server stopped, clicking "Guess" shows the server-error message and does not freeze the controls.
- [x] `git log --oneline` shows an incremental history with imperative messages, and `mystery_figure.db` is not committed.
## 5. Commit Plan
1. Add Flask scaffold that serves the Sprint 1 frontend from localhost:5000
2. Move figure data into seed_figures.json and load it into in-memory lists
3. Add in-memory round routes for start, guess, skip, and history
4. Add input validation and JSON error handlers for 400/404/405/500
5. Move guess matching from app.js into matcher.py
6. Replace hardcoded frontend data with fetch calls to the API
7. Show server validation errors and status-based feedback in the UI
8. Add SQLite schema and seed figures on first run
9. Migrate round routes from in-memory lists to SQLite queries
10. Add delete route and remove button for history rounds
11. Add Sprint 2 report and update spec checklist
## 6. Audit Protocol
- Test every error case with the browser's Network tab or `curl` and confirm the status code and JSON body.
- Run the restart test (Ctrl+C, then `python app.py`) before submitting.
