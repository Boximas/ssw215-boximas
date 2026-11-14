const game = document.getElementById("game");
const startPanel = document.getElementById("start-panel");
const roundContent = document.getElementById("round-content");
const revealPanel = document.getElementById("reveal-panel");
const revealName = document.getElementById("reveal-name");
const revealText = document.getElementById("reveal-text");
const revealScore = document.getElementById("reveal-score");
const progress = document.getElementById("progress");
const clueList = document.getElementById("clue-list");
const guessList = document.getElementById("guess-list");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const guessBtn = document.getElementById("guess-btn");
const skipBtn = document.getElementById("skip-btn");
const startBtn = document.getElementById("start-btn");
const newRoundBtn = document.getElementById("new-round-btn");
const statusMsg = document.getElementById("status-msg");
const statPlayed = document.getElementById("stat-played");
const statCorrect = document.getElementById("stat-correct");
const statStreak = document.getElementById("stat-streak");
const historyList = document.getElementById("history-list");

let currentRound = null;

async function apiRequest(method, path, body) {
  const options = {
    method,
    headers: { Accept: "application/json" }
  };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(path, options);
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { status: response.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

function setStatus(message, isError = false) {
  statusMsg.textContent = message;
  statusMsg.classList.toggle("is-error", isError);
}

function updateControls() {
  const status = game.dataset.status;
  const isPlaying = status === "playing";
  const isChecking = status === "checking";

  guessInput.disabled = !isPlaying;
  guessBtn.disabled = !isPlaying || guessInput.value.trim().length === 0;
  skipBtn.disabled =
    !isPlaying ||
    !currentRound ||
    currentRound.clues_revealed >= currentRound.total_clues;
  startBtn.disabled = isChecking;
  newRoundBtn.disabled = isChecking;
}

function renderStats(stats) {
  statPlayed.textContent = String(stats.played);
  statCorrect.textContent = String(stats.correct);
  statStreak.textContent = String(stats.streak);
}

function renderHistory(rounds) {
  historyList.replaceChildren();

  rounds.forEach((round) => {
    const item = document.createElement("li");
    item.className = "history-card";
    item.dataset.roundId = String(round.id);
    item.dataset.figureId = round.figure.slug;
    item.dataset.result = round.correct ? "correct" : "incorrect";

    const heading = document.createElement("div");
    heading.className = "history-card__heading";

    const figureName = document.createElement("span");
    figureName.className = "history-card__figure";
    figureName.textContent = round.figure.name;

    const score = document.createElement("span");
    score.className = "history-card__score";
    score.textContent = `Score ${round.score}`;

    const meta = document.createElement("div");
    meta.className = "history-card__meta";
    meta.textContent = `${round.correct ? "Correct" : "Incorrect"} · ${round.clues_revealed} clues used`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn--secondary history-card__remove";
    removeButton.dataset.removeRound = String(round.id);
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove round for ${round.figure.name}`);

    heading.append(figureName, score);
    item.append(heading, meta, removeButton);
    historyList.appendChild(item);
  });
}

async function refreshHistory() {
  const response = await apiRequest("GET", "/api/rounds");
  if (response.status !== 200 || !response.data) {
    handleRequestError(response);
    return false;
  }

  renderStats(response.data.stats);
  renderHistory(response.data.rounds);
  return true;
}

function renderRound(round) {
  currentRound = round;
  if (!round) {
    return setIdle();
  }

  game.dataset.status = round.status;
  startPanel.classList.add("hidden");
  roundContent.classList.remove("hidden");
  progress.dataset.total = String(round.total_clues);
  progress.dataset.revealed = String(round.clues_revealed);
  progress.style.setProperty(
    "--progress",
    `${(round.clues_revealed / round.total_clues) * 100}%`
  );
  progress.querySelector(".progress__label").textContent =
    `Clue ${round.clues_revealed} of ${round.total_clues}`;

  progress.querySelectorAll(".progress__dot").forEach((dot, index) => {
    dot.classList.toggle("is-active", index < round.clues_revealed);
  });

  clueList.replaceChildren();
  round.clues.forEach((clue) => {
    const item = document.createElement("li");
    item.className = "clue-card";
    item.textContent = clue;
    clueList.appendChild(item);
  });

  guessList.replaceChildren();
  const wrongGuesses =
    round.correct === true ? round.guesses.slice(0, -1) : round.guesses;
  wrongGuesses.forEach((guess) => {
    const chip = document.createElement("li");
    chip.className = "chip chip--wrong";
    chip.textContent = guess;
    guessList.appendChild(chip);
  });

  if (round.status === "playing") {
    revealPanel.classList.add("hidden");
    revealPanel.classList.remove("reveal-panel--won", "reveal-panel--lost");
  } else {
    revealName.textContent = round.figure.name;
    revealText.textContent = round.figure.reveal;
    revealScore.textContent = `Round score: ${round.score}`;
    revealPanel.classList.remove("reveal-panel--won", "reveal-panel--lost");
    revealPanel.classList.add(
      round.status === "won" ? "reveal-panel--won" : "reveal-panel--lost"
    );
    revealPanel.classList.remove("hidden");
  }

  guessInput.value = "";
  updateControls();
}

function setIdle() {
  currentRound = null;
  game.dataset.status = "idle";
  startPanel.classList.remove("hidden");
  roundContent.classList.add("hidden");
  revealPanel.classList.add("hidden");
  clueList.replaceChildren();
  guessList.replaceChildren();
  progress.dataset.revealed = "0";
  progress.style.setProperty("--progress", "0%");
  progress.querySelector(".progress__label").textContent = "Clue 0 of 6";
  progress.querySelectorAll(".progress__dot").forEach((dot) => {
    dot.classList.remove("is-active");
  });
  updateControls();
}

function handleRequestError(response) {
  if (response.status === 400 && response.data?.error) {
    setStatus(response.data.error.message, true);
    if (response.data.error.field === "guess") {
      guessInput.classList.add("input--invalid");
    }
    if (currentRound) {
      game.dataset.status = currentRound.status;
    } else {
      setIdle();
    }
  } else if (response.status === 404) {
    setIdle();
    setStatus("That round no longer exists. Start a new one.", true);
  } else {
    setStatus("Something went wrong on the server. Please try again.", true);
    if (currentRound) {
      game.dataset.status = currentRound.status;
    } else {
      setIdle();
    }
  }
  updateControls();
}

async function startRound() {
  game.dataset.status = "checking";
  startPanel.classList.add("hidden");
  setStatus("Starting a new round…");
  updateControls();

  const response = await apiRequest("POST", "/api/rounds");
  if (response.status !== 201 || !response.data) {
    handleRequestError(response);
    return;
  }

  renderRound(response.data);
  setStatus("Make your guess.");
}

async function submitGuess(event) {
  event.preventDefault();
  const guess = guessInput.value.trim();
  if (!guess) {
    setStatus("Enter a name first.", true);
    return;
  }
  if (!currentRound || game.dataset.status !== "playing") {
    return;
  }

  game.dataset.status = "checking";
  setStatus("Checking…");
  updateControls();
  const response = await apiRequest(
    "POST",
    `/api/rounds/${currentRound.id}/guesses`,
    { guess }
  );
  if (response.status !== 200 || !response.data) {
    handleRequestError(response);
    return;
  }

  renderRound(response.data.round);
  if (response.data.match) {
    setStatus("Correct! You solved it.");
    await refreshHistory();
  } else if (response.data.round.status === "lost") {
    setStatus("No more clues remain.");
    await refreshHistory();
  } else {
    setStatus("Not quite! Here's another clue.");
  }
}

async function skipClue() {
  if (!currentRound || game.dataset.status !== "playing") {
    return;
  }

  game.dataset.status = "checking";
  setStatus("Loading the next clue…");
  updateControls();
  const response = await apiRequest(
    "POST",
    `/api/rounds/${currentRound.id}/skip`
  );
  if (response.status !== 200 || !response.data) {
    handleRequestError(response);
    return;
  }

  renderRound(response.data);
  setStatus("Another clue has appeared.");
}

async function removeHistoryRound(roundId, button) {
  button.disabled = true;
  const response = await apiRequest("DELETE", `/api/rounds/${roundId}`);
  if (response.status !== 204) {
    button.disabled = false;
    handleRequestError(response);
    return;
  }

  historyList.querySelector(`[data-round-id="${roundId}"]`)?.remove();
  await refreshHistory();
}

startBtn.addEventListener("click", startRound);
newRoundBtn.addEventListener("click", startRound);
guessForm.addEventListener("submit", submitGuess);
guessInput.addEventListener("input", () => {
  guessInput.classList.remove("input--invalid");
  statusMsg.classList.remove("is-error");
  updateControls();
});
guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && guessInput.value.trim().length === 0) {
    event.preventDefault();
    setStatus("Enter a name first.", true);
  }
});
skipBtn.addEventListener("click", skipClue);
historyList.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-remove-round]");
  if (button) {
    removeHistoryRound(button.dataset.removeRound, button);
  }
});

async function initialize() {
  if (!(await refreshHistory())) {
    setIdle();
    return;
  }

  const response = await apiRequest("GET", "/api/rounds/current");
  if (response.status !== 200 || !response.data) {
    handleRequestError(response);
    return;
  }
  if (response.data.round) {
    renderRound(response.data.round);
    setStatus("Your round has been resumed.");
  } else {
    setIdle();
    setStatus("Choose a figure to begin.");
  }
}

updateControls();
initialize();
