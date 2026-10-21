const FIGURES = [
  {
    id: "julius-caesar",
    name: "Julius Caesar",
    clues: [
      "I was assassinated by members of the Senate in the Roman Forum.",
      "I crossed the Rubicon with my legions and seized power in Rome.",
      "I was a Roman general whose title of dictator reshaped the Republic.",
      "My family name became shorthand for a political strongman in later centuries.",
      "I ruled in the first century BC and was famed for my military campaigns in Gaul.",
      "I was a celebrated Roman statesman and conqueror of Gaul."
    ],
    reveal: "Julius Caesar (100–44 BC) was a Roman general and statesman whose rise to power transformed the Roman Republic into an empire. He conquered Gaul, crossed the Rubicon, and was later assassinated by senators fearing his authority. His name became a byword for political ambition and power.",
    mockAliases: ["caesar", "gaius julius caesar"]
  },
  {
    id: "cleopatra",
    name: "Cleopatra",
    clues: [
      "My alliance with Julius Caesar and Mark Antony shaped Roman politics.",
      "I ruled Egypt and was famously depicted with a golden serpent headdress.",
      "I was the last active ruler of the Ptolemaic Kingdom.",
      "I was known for my intelligence, diplomacy, and strategic marriages.",
      "I lived in the first century BC and had a complex relationship with Rome.",
      "I was the legendary queen of ancient Egypt."
    ],
    reveal: "Cleopatra (c. 69–30 BC) was the last active ruler of Ptolemaic Egypt. She forged alliances with Roman leaders Julius Caesar and Mark Antony, and her political maneuvering helped shape the fate of the Roman Republic. Her life became intertwined with legend, romance, and the end of Roman rule in Egypt.",
    mockAliases: ["cleopatra vii", "queen cleopatra"]
  },
  {
    id: "ada-lovelace",
    name: "Ada Lovelace",
    clues: [
      "I wrote notes that described how a machine could manipulate symbols beyond mere calculation.",
      "My work on Charles Babbage's Analytical Engine is often called the first computer program.",
      "I was an English mathematician and writer in the 1800s.",
      "I was the daughter of famed poet Lord Byron.",
      "I published notes on a proposed computing machine in 1843.",
      "I am remembered as a visionary pioneer of computing."
    ],
    reveal: "Ada Lovelace (1815–1852) was an English mathematician and writer who published notes on Charles Babbage's Analytical Engine. Her work imagined machines that could do more than arithmetic, including symbolic reasoning and algorithmic creativity. She is often celebrated as a visionary pioneer of computing.",
    mockAliases: ["ada byron", "augusta ada king"]
  },
  {
    id: "marie-curie",
    name: "Marie Curie",
    clues: [
      "I won Nobel Prizes in both physics and chemistry, a rare achievement.",
      "I conducted groundbreaking research on radioactivity during the early 1900s.",
      "I was a Polish-born physicist and chemist who worked in France.",
      "My research led to advances in medicine and nuclear physics.",
      "I studied uranium and discovered polonium and radium.",
      "I am one of the most famous scientists in modern history."
    ],
    reveal: "Marie Curie (1867–1934) was a Polish-born physicist and chemist who conducted pioneering research on radioactivity. She discovered polonium and radium and was the first person to win two Nobel Prizes in different scientific fields. Her work transformed science and medicine, and she remains a defining figure in modern research.",
    mockAliases: ["maria sklodowska curie", "curie"]
  },
  {
    id: "abraham-lincoln",
    name: "Abraham Lincoln",
    clues: [
      "I was assassinated at Ford's Theatre in 1865.",
      "I served as the 16th president of the United States during the Civil War.",
      "I delivered the Gettysburg Address in 1863.",
      "I led the Union in the American Civil War.",
      "I was a lawyer before entering politics.",
      "I was one of the most famous American presidents."
    ],
    reveal: "Abraham Lincoln (1809–1865) was the 16th president of the United States and led the Union through the Civil War. He signed the Emancipation Proclamation and delivered the Gettysburg Address, helping redefine the meaning of freedom in America. His presidency is remembered for both national survival and the abolition of slavery.",
    mockAliases: ["lincoln", "abe lincoln"]
  },
  {
    id: "charles-darwin",
    name: "Charles Darwin",
    clues: [
      "I traveled on HMS Beagle and observed species variation across the globe.",
      "My theory of evolution by natural selection changed how people understood life.",
      "I was an English naturalist and biologist from the 19th century.",
      "My book On the Origin of Species was published in 1859.",
      "I studied finches and other organisms in the Galápagos Islands.",
      "I developed a theory that transformed biology."
    ],
    reveal: "Charles Darwin (1809–1882) was an English naturalist whose observations during the voyage of HMS Beagle led to groundbreaking ideas about evolution. He proposed natural selection as the mechanism of evolutionary change, which transformed biology and challenged many long-held beliefs. His work remains foundational to modern science.",
    mockAliases: ["darwin", "charles robert darwin"]
  }
];

const game = document.getElementById("game");
const startPanel = document.getElementById("start-panel");
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

const state = {
  currentFigure: null,
  usedFigureIds: [],
  sessionHistory: [],
  sessionStats: {
    played: 0,
    correct: 0,
    streak: 0
  },
  wrongGuesses: [],
  revealedClues: 0
};

function normalizeGuess(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function checkGuess(guess, figure) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedGuess = normalizeGuess(guess);
      const normalizedName = normalizeGuess(figure.name);
      const surname = normalizedName.split(/\s+/).at(-1) || "";
      const aliases = (figure.mockAliases || []).map((alias) => normalizeGuess(alias));
      const match =
        normalizedGuess === normalizedName ||
        normalizedGuess === surname ||
        aliases.includes(normalizedGuess);

      console.log(guess, match);
      resolve({ match });
    }, 400);
  });
}

function setStatus(message) {
  statusMsg.textContent = message;
}

function updateStats() {
  statPlayed.textContent = String(state.sessionStats.played);
  statCorrect.textContent = String(state.sessionStats.correct);
  statStreak.textContent = String(state.sessionStats.streak);
}

function renderGuessChips() {
  guessList.innerHTML = "";

  state.wrongGuesses.forEach((guess) => {
    const chip = document.createElement("li");
    chip.className = "chip chip--wrong";
    chip.textContent = guess;
    guessList.appendChild(chip);
  });
}

function updateProgress() {
  const total = Number(progress.dataset.total || 6);
  const percentage = (state.revealedClues / total) * 100;
  progress.dataset.revealed = String(state.revealedClues);
  progress.style.setProperty("--progress", `${percentage}%`);
  const dots = progress.querySelectorAll(".progress__dot");

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index < state.revealedClues);
  });

  const currentText = `Clue ${Math.min(state.revealedClues, total)} of ${total}`;
  progress.querySelector(".progress__label").textContent = currentText;
}

function renderClues() {
  clueList.innerHTML = "";

  if (!state.currentFigure) {
    return;
  }

  const visibleClues = state.currentFigure.clues.slice(0, state.revealedClues);
  visibleClues.forEach((clue) => {
    const item = document.createElement("li");
    item.className = "clue-card";
    item.textContent = clue;
    clueList.appendChild(item);
  });
}

function updateControls() {
  const isIdle = game.dataset.status === "idle";
  const isChecking = game.dataset.status === "checking";
  const isFinished = game.dataset.status === "won" || game.dataset.status === "lost";
  const inputValue = guessInput.value.trim();

  guessInput.disabled = isIdle || isChecking || isFinished;
  guessBtn.disabled = isIdle || isChecking || isFinished || inputValue.length === 0;
  skipBtn.disabled = isIdle || isChecking || isFinished || state.revealedClues >= 6;
}

function setRevealPanel(result) {
  revealPanel.classList.remove("reveal-panel--won", "reveal-panel--lost");
  if (result === "won") {
    revealPanel.classList.add("reveal-panel--won");
  }

  if (result === "lost") {
    revealPanel.classList.add("reveal-panel--lost");
  }

  revealPanel.classList.remove("hidden");
}

function renderHistory() {
  historyList.innerHTML = "";

  state.sessionHistory.forEach((round) => {
    const item = document.createElement("li");
    item.className = "history-card";
    item.dataset.figureId = round.figureId;
    item.dataset.result = round.correct ? "correct" : "incorrect";

    const heading = document.createElement("div");
    heading.className = "history-card__heading";

    const figureName = document.createElement("span");
    figureName.className = "history-card__figure";
    const figure = FIGURES.find((entry) => entry.id === round.figureId);
    figureName.textContent = figure ? figure.name : round.figureId;

    const score = document.createElement("span");
    score.className = "history-card__score";
    score.textContent = `Score ${round.score}`;

    heading.appendChild(figureName);
    heading.appendChild(score);

    const meta = document.createElement("div");
    meta.textContent = `${round.correct ? "Correct" : "Incorrect"} • ${round.cluesUsed} clues used`;

    item.appendChild(heading);
    item.appendChild(meta);
    historyList.appendChild(item);
  });
}

function finishRound(correct, score) {
  const record = {
    figureId: state.currentFigure.id,
    guesses: [...state.wrongGuesses],
    cluesUsed: state.revealedClues,
    correct,
    score,
    timestamp: Date.now()
  };

  state.sessionHistory.push(record);
  state.sessionStats.played += 1;

  if (correct) {
    state.sessionStats.correct += 1;
    state.sessionStats.streak += 1;
  } else {
    state.sessionStats.streak = 0;
  }

  updateStats();
  renderHistory();
}

function startRound() {
  const availableFigures = FIGURES.filter((figure) => !state.usedFigureIds.includes(figure.id));

  if (availableFigures.length === 0) {
    state.usedFigureIds = [];
  }

  const nextFigure = FIGURES.filter((figure) => !state.usedFigureIds.includes(figure.id));
  const chosenFigure = nextFigure[Math.floor(Math.random() * nextFigure.length)];

  if (!chosenFigure) {
    return;
  }

  state.currentFigure = chosenFigure;
  state.usedFigureIds.push(chosenFigure.id);
  state.wrongGuesses = [];
  state.revealedClues = 1;
  guessInput.value = "";
  revealPanel.classList.add("hidden");
  revealPanel.classList.remove("reveal-panel--won", "reveal-panel--lost");
  startPanel.classList.add("hidden");
  game.dataset.status = "playing";
  setStatus("Make your guess.");
  renderGuessChips();
  updateProgress();
  renderClues();
  updateControls();
}

function revealNextClue() {
  if (!state.currentFigure) {
    return;
  }

  if (state.revealedClues < 6) {
    state.revealedClues += 1;
  }

  updateProgress();
  renderClues();
  updateControls();
}

async function handleGuessSubmit(event) {
  event.preventDefault();

  if (!state.currentFigure) {
    return;
  }

  const rawGuess = guessInput.value.trim();

  if (!rawGuess) {
    setStatus("Enter a name first.");
    return;
  }

  const duplicate = state.wrongGuesses.some(
    (guess) => normalizeGuess(guess) === normalizeGuess(rawGuess)
  );

  if (duplicate) {
    setStatus("You already guessed that.");
    return;
  }

  game.dataset.status = "checking";
  guessInput.disabled = true;
  guessBtn.disabled = true;
  skipBtn.disabled = true;
  setStatus("Checking…");

  const result = await checkGuess(rawGuess, state.currentFigure);

  if (result.match) {
    const score = 7 - state.revealedClues;
    revealName.textContent = state.currentFigure.name;
    revealText.textContent = state.currentFigure.reveal;
    revealScore.textContent = `Round score: ${score}`;
    setRevealPanel("won");
    finishRound(true, score);
    game.dataset.status = "won";
    setStatus("Correct! You solved it.");
    updateControls();
    return;
  }

  state.wrongGuesses.push(rawGuess);
  renderGuessChips();

  if (state.revealedClues >= 6) {
    revealName.textContent = state.currentFigure.name;
    revealText.textContent = state.currentFigure.reveal;
    revealScore.textContent = "Round score: 0";
    setRevealPanel("lost");
    finishRound(false, 0);
    game.dataset.status = "lost";
    setStatus("No more clues remain.");
    updateControls();
    return;
  }

  revealNextClue();
  game.dataset.status = "playing";
  setStatus("Not quite! Here's another clue.");
  guessInput.value = "";
  updateControls();
}

startBtn.addEventListener("click", startRound);
newRoundBtn.addEventListener("click", startRound);
guessForm.addEventListener("submit", handleGuessSubmit);
guessInput.addEventListener("input", () => {
  updateControls();
});
skipBtn.addEventListener("click", () => {
  if (game.dataset.status !== "playing") {
    return;
  }

  if (state.revealedClues >= 6) {
    return;
  }

  revealNextClue();
  setStatus("Another clue has appeared.");
  guessInput.value = "";
  updateControls();
});

updateStats();
updateProgress();
renderHistory();
updateControls();
