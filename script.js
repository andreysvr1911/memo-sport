const TOTAL_PAIRS = 25;
const CARD_BACK_IMAGE = "images/26.jpg";
const ZOOM_DURATION = 1000;
const RECORDS_KEY = "memoSportRecords";
const MAX_RECORDS = 10;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

const board = document.getElementById("board");
const movesElement = document.getElementById("moves");
const timerElement = document.getElementById("timer");
const pairsElement = document.getElementById("pairs");
const restartButton = document.getElementById("restart");
const showRecordsButton = document.getElementById("showRecords");

const zoomOverlay = document.getElementById("zoomOverlay");
const zoomImage = document.getElementById("zoomImage");

const winScreen = document.getElementById("winScreen");
const finalStats = document.getElementById("finalStats");
const playerNameInput = document.getElementById("playerName");
const saveRecordButton = document.getElementById("saveRecord");
const playAgainButton = document.getElementById("playAgain");

const recordsScreen = document.getElementById("recordsScreen");
const recordsList = document.getElementById("recordsList");
const clearRecordsButton = document.getElementById("clearRecords");
const closeRecordsButton = document.getElementById("closeRecords");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
let startTime = null;
let timerInterval = null;
let finalTime = 0;
let zoomTimeout = null;

function createDeck() {
  const deck = [];

  for (let imageNumber = 1; imageNumber <= TOTAL_PAIRS; imageNumber++) {
    const cardData = {
      id: imageNumber,
      candidates: IMAGE_EXTENSIONS.map(
        extension => `images/${imageNumber}.${extension}`
      )
    };

    deck.push(cardData, cardData);
  }

  return shuffle(deck);
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function createCard(cardData) {
  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.dataset.imageId = cardData.id;

  const cardBackImage = document.createElement("img");
  cardBackImage.src = cardData.candidates[0];
  cardBackImage.alt = `Карточка ${cardData.id}`;

  cardBackImage.addEventListener("load", () => {
    card.dataset.resolvedImage = cardBackImage.currentSrc || cardBackImage.src;
  });

  setImageFallback(cardBackImage, cardData.candidates);

  const cardFrontImage = document.createElement("img");
  cardFrontImage.src = CARD_BACK_IMAGE;
  cardFrontImage.alt = "Рубашка карточки";

  const cardInner = document.createElement("div");
  cardInner.className = "card-inner";

  const cardFront = document.createElement("div");
  cardFront.className = "card-front";
  cardFront.appendChild(cardFrontImage);

  const cardBack = document.createElement("div");
  cardBack.className = "card-back";
  cardBack.appendChild(cardBackImage);

  cardInner.append(cardFront, cardBack);
  card.appendChild(cardInner);

  card.addEventListener("click", () => handleCardClick(card));
  return card;
}

function setImageFallback(image, candidates) {
  let candidateIndex = 0;

  image.addEventListener("error", () => {
    candidateIndex++;

    if (candidateIndex < candidates.length) {
      image.src = candidates[candidateIndex];
    }
  });
}

function renderBoard() {
  board.innerHTML = "";
  const deck = createDeck();

  deck.forEach(cardData => {
    board.appendChild(createCard(cardData));
  });
}

function handleCardClick(card) {
  if (
    lockBoard ||
    card === firstCard ||
    card.classList.contains("is-matched") ||
    card.classList.contains("is-flipped")
  ) {
    return;
  }

  if (!startTime) {
    startTimer();
  }

  card.classList.add("is-flipped");
  showZoom(card.dataset.resolvedImage || card.dataset.imageId);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves++;
  movesElement.textContent = moves;

  const isMatch =
    firstCard.dataset.imageId === secondCard.dataset.imageId;

  if (isMatch) {
    lockBoard = true;

    setTimeout(() => {
      firstCard.classList.add("is-matched");
      secondCard.classList.add("is-matched");

      firstCard.classList.remove("is-flipped");
      secondCard.classList.remove("is-flipped");

      matchedPairs++;
      pairsElement.textContent = matchedPairs;

      resetTurn();

      if (matchedPairs === TOTAL_PAIRS) {
        stopTimer();
        setTimeout(showWinScreen, 400);
      }
    }, ZOOM_DURATION);

    return;
  }

  lockBoard = true;
  firstCard.classList.add("is-wrong");
  secondCard.classList.add("is-wrong");

  setTimeout(() => {
    firstCard.classList.remove("is-flipped", "is-wrong");
    secondCard.classList.remove("is-flipped", "is-wrong");
    resetTurn();
  }, ZOOM_DURATION + 250);
}

function showZoom(imagePath) {
  if (!imagePath || imagePath === "undefined") {
    return;
  }

  zoomImage.src = imagePath;
  zoomOverlay.classList.remove("hidden");

  clearTimeout(zoomTimeout);
  zoomTimeout = setTimeout(hideZoom, ZOOM_DURATION);
}

function hideZoom() {
  zoomOverlay.classList.add("hidden");
  clearTimeout(zoomTimeout);
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function startTimer() {
  startTime = Date.now();

  timerInterval = setInterval(() => {
    finalTime = Math.floor((Date.now() - startTime) / 1000);
    timerElement.textContent = formatTime(finalTime);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function showWinScreen() {
  finalStats.textContent =
    `Ходов: ${moves}. Время: ${formatTime(finalTime)}.`;

  playerNameInput.value = "";
  winScreen.classList.remove("hidden");
  playerNameInput.focus();
}

function getRecords() {
  const savedRecords = localStorage.getItem(RECORDS_KEY);

  if (!savedRecords) {
    return [];
  }

  try {
    const parsedRecords = JSON.parse(savedRecords);
    return Array.isArray(parsedRecords) ? parsedRecords : [];
  } catch {
    return [];
  }
}

function saveRecord() {
  const playerName = playerNameInput.value.trim() || "Игрок";
  const records = getRecords();

  records.push({
    name: playerName,
    time: finalTime,
    moves,
    date: new Date().toLocaleDateString("ru-RU")
  });

  records.sort((a, b) => a.time - b.time);

  localStorage.setItem(
    RECORDS_KEY,
    JSON.stringify(records.slice(0, MAX_RECORDS))
  );

  winScreen.classList.add("hidden");
  openRecords();
}

function renderRecords() {
  const records = getRecords();
  recordsList.innerHTML = "";

  if (records.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Пока нет сохранённых рекордов.";
    recordsList.appendChild(emptyItem);
    return;
  }

  records.forEach((record, index) => {
    const item = document.createElement("li");
    item.textContent =
      `${index + 1}. ${record.name} — ${formatTime(record.time)} ` +
      `(${record.moves} ходов, ${record.date})`;

    recordsList.appendChild(item);
  });
}

function openRecords() {
  renderRecords();
  recordsScreen.classList.remove("hidden");
}

function clearRecords() {
  localStorage.removeItem(RECORDS_KEY);
  renderRecords();
}

zoomOverlay.addEventListener("click", hideZoom);
restartButton.addEventListener("click", restartGame);
playAgainButton.addEventListener("click", restartGame);
saveRecordButton.addEventListener("click", saveRecord);

showRecordsButton.addEventListener("click", openRecords);
closeRecordsButton.addEventListener("click", () => {
  recordsScreen.classList.add("hidden");
});

clearRecordsButton.addEventListener("click", clearRecords);

function restartGame() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matchedPairs = 0;
  startTime = null;
  finalTime = 0;

  movesElement.textContent = "0";
  pairsElement.textContent = "0";
  timerElement.textContent = "0:00";

  stopTimer();
  hideZoom();
  winScreen.classList.add("hidden");
  recordsScreen.classList.add("hidden");
  renderBoard();
}

renderBoard();