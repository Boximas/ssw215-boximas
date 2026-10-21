# SPEC: Mystery Figure Trivia Game (Sprint 1)
## 1. Purpose & Scope
- A single-player browser trivia game for an individual history enthusiast. Each round
picks a random figure from a fixed list and reveals hand-written clues one at a time
until the player guesses who it is or runs out of clues.
- Core workflow: Start round -> read clue -> submit guess -> (wrong: next clue / right:
round ends) -> view reveal -> start next round.
- Sprint 1 runs entirely client-side on localhost.
- Non-Goals: no backend or database; no real LLM API calls (guess checking is mocked);
no user accounts, leaderboards, or sharing; no adding or editing figures from the UI.

## 2. Invariants & Negative Constraints
- The project MUST consist of `./index.html`, `./style.css`, and `./app.js`.
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
- Figure data MUST be a constant array `FIGURES` in app.js with at least 5 figures from
different eras and fields.
- Every figure MUST have exactly 6 clues (ordered hardest to easiest) and a 2–4 sentence
reveal.
- The UI MUST only call `checkGuess(guess, figure)`, which MUST return
`Promise<{ match: boolean }>`, so the Sprint 3 LLM call can replace the mock without UI
changes.
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
- Status message: a <p id="status-msg" aria-live="polite">.
- Reveal panel: a <section id="reveal-panel" class="hidden"> showing the figure's name,
reveal text, round score, and a "New Round" button.
- History list: a <section> with heading "Session History" containing
<ul id="history-list">, where each completed round is an
<li class="history-card"> with `data-figure-id` and `data-result="correct|incorrect"`.

### 3.4 Behavior
- Clicking "Start Game" or "New Round" MUST pick a random figure not yet used this
session, clear the clue and guess lists, reveal clue 1, set data-status to "playing",
and hide the start and reveal panels.
- Figures MUST NOT repeat until every figure has been played; then the used set resets.
- The "Guess" button MUST be disabled while the trimmed input is empty.
- Submitting a guess MUST set data-status to "checking", disable the input and all
buttons, and show "Checking…" in the status message.
- Submitting an empty guess (e.g. with Enter) MUST show "Enter a name first." and MUST
NOT call checkGuess.
- Repeating a guess already made this round (case-insensitive) MUST show "You already
guessed that." and MUST NOT cost a clue.
- A wrong guess with clues remaining MUST add a wrong-guess chip, append the next clue
card, increment data-revealed, fill the next progress dot, widen the fill bar, and show
"Not quite! Here's another clue."
- Clicking "Skip to next clue" MUST reveal the next clue without adding a chip.
- The skip button MUST be disabled when all 6 clues are revealed.
- data-revealed MUST NOT exceed data-total.
- A correct guess MUST set data-status to "won", compute score = 7 − clues revealed, show
the reveal panel with the "won" style, append a history card, and update the stats and
streak.
- A wrong guess on clue 6 MUST set data-status to "lost", score 0, show the reveal panel
with the "lost" style, append a history card, update the stats, and reset the streak.
- In the "won" and "lost" states, the guess form and skip button MUST be disabled until
"New Round" is clicked.
- Buttons MUST have visually distinct :hover, :focus-visible, :active, and :disabled
states, and all four rules MUST live in style.css.
- New clue cards SHOULD animate in, and the progress fill width SHOULD transition
smoothly.

### 3.5 Mock Guess Matcher (Sprint 1)
- checkGuess MUST normalize input: lowercase, trim, strip accents (`normalize("NFD")`),
remove punctuation, and collapse whitespace.
- checkGuess MUST return match: true if the normalized guess equals the normalized full
name, the final word of the name (surname), or any entry in mockAliases.
- checkGuess MUST resolve after a ~400 ms delay so the "checking" state is visible.
- Each time a guess is checked, app.js MUST print the guess and the match result to the
console with console.log.

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
- [x] No figure repeats until every figure has been played.
- [x] Every guess prints the guess and its match result in the Console.
- [x] At widths below 768px, the layout is a single column with no horizontal scroll.

## 5. Audit Protocol
- Inspect the generated code line by line with `git diff --staged` before committing.
- Test the full checklist in Chrome and one other browser before submitting.
