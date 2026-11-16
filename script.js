const dictionary = {
    5: ["apple", "beach", "chair", "cloud", "dream", "flame", "grape", "house", "light", "river"],
    6: ["basket", "bright", "castle", "forest", "garden", "planet", "silver", "tomato", "window", "yellow"],
    7: ["another", "blanket", "dolphin", "freedom", "journey", "kitchen", "morning", "picture", "thunder", "village"],
    8: ["absolute", "birthday", "cheerful", "dinosaur", "fountain", "graceful", "mountain", "notebook", "sunshine", "triangle"],
    9: ["adventure", "butterfly", "chocolate", "discovery", "excellent", "important", "landscape", "telephone", "wonderful", "yesterday"]
};

const board = document.getElementById("board");
const message = document.getElementById("message");
const guessCounter = document.getElementById("guessCounter");
const keyboard = document.getElementById("keyboard");
const wordLengthSelect = document.getElementById("wordLength");
const hardModeToggle = document.getElementById("hardMode");
const newGameButton = document.getElementById("newGameButton");

const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const keyButtons = new Map();
let wordLength = Number(wordLengthSelect.value);
let maxGuesses = 6;
let answer = "";
let guesses = [];
let currentGuess = "";
let boardCells = [];
let gameOver = false;
let isRevealing = false;

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function chooseAnswer(length) {
    const shuffled = [...dictionary[length]];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    const answerOptions = shuffled.slice(0, Math.ceil(shuffled.length * 0.2));
    return randomItem(answerOptions);
}

function makeKeyboard() {
    keyboard.replaceChildren();
    keyButtons.clear();

    keyboardRows.forEach((letters, rowIndex) => {
        const row = document.createElement("div");
        row.className = "keyboard-row";
        if (rowIndex === 2) {
            row.append(makeKey("Enter", "wide-key"));
        }

        for (const letter of letters) {
            row.append(makeKey(letter, ""));
        }

        if (rowIndex === 2) {
            row.append(makeKey("⌫", "wide-key"));
        }
        keyboard.append(row);
    });
}

function makeKey(label, extraClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `key ${extraClass}`.trim();
    button.textContent = label;
    button.setAttribute("aria-label", label === "⌫" ? "Backspace" : label);
    button.addEventListener("click", () => handleKey(label));
    if (label.length === 1 && /^[a-z]$/.test(label)) {
        keyButtons.set(label, button);
    }
    return button;
}

function makeBoard() {
    board.replaceChildren();
    board.style.setProperty("--word-length", wordLength);
    boardCells = [];

    for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex++) {
        const row = document.createElement("div");
        row.className = "board-row";
        row.setAttribute("role", "row");
        const cells = [];

        for (let columnIndex = 0; columnIndex < wordLength; columnIndex++) {
            const cell = document.createElement("div");
            cell.className = "tile";
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("aria-label", `Row ${rowIndex + 1}, letter ${columnIndex + 1}`);
            row.append(cell);
            cells.push(cell);
        }

        board.append(row);
        boardCells.push(cells);
    }
    renderBoard();
}

function renderBoard() {
    boardCells.forEach((cells, rowIndex) => {
        const guess = guesses[rowIndex];
        cells.forEach((cell, columnIndex) => {
            cell.textContent = guess
                ? guess.word[columnIndex]
                : rowIndex === guesses.length && !gameOver
                    ? currentGuess[columnIndex] || ""
                    : "";
            cell.className = "tile";
            if (guess && columnIndex < (guess.revealedCount || 0)) {
                cell.classList.add(`tile--${guess.marks[columnIndex]}`);
            }
        });
    });
}

function updateCounter() {
    guessCounter.textContent = `Guesses: ${guesses.length} / ${maxGuesses}`;
}

function updateMessage(text, kind = "") {
    message.textContent = text;
    message.className = `message ${kind}`.trim();
}

function startNewGame() {
    wordLength = Number(wordLengthSelect.value);
    maxGuesses = hardModeToggle.checked ? 5 : 6;
    answer = chooseAnswer(wordLength);
    guesses = [];
    currentGuess = "";
    gameOver = false;
    isRevealing = false;
    keyButtons.forEach((button) => {
        button.className = "key";
    });

    makeBoard();
    updateCounter();
    updateMessage("Type a word, then press Enter.");
    document.querySelector(".instructions").textContent = hardModeToggle.checked
        ? "Guess the word in 5 tries. Hard mode keeps every green letter in place and requires all revealed yellow and green letters."
        : "Guess the word in 6 tries. Green is the right letter in the right spot; yellow is right letter, wrong spot.";
}

function scoreGuess(word) {
    const marks = Array(wordLength).fill("gray");
    const remaining = new Map();

    for (let index = 0; index < wordLength; index++) {
        if (word[index] === answer[index]) {
            marks[index] = "green";
        } else {
            remaining.set(answer[index], (remaining.get(answer[index]) || 0) + 1);
        }
    }

    for (let index = 0; index < wordLength; index++) {
        if (marks[index] === "green") {
            continue;
        }
        const count = remaining.get(word[index]) || 0;
        if (count > 0) {
            marks[index] = "yellow";
            remaining.set(word[index], count - 1);
        }
    }
    return marks;
}

function checkHardMode(word) {
    const minimumLetters = new Map();
    const yellowPositions = new Set();
    const greenPositions = new Map();

    for (const guess of guesses) {
        const positiveCounts = new Map();
        guess.marks.forEach((mark, index) => {
            if (mark === "green") {
                greenPositions.set(index, guess.word[index]);
            } else if (mark === "yellow") {
                yellowPositions.add(`${index}:${guess.word[index]}`);
            }

            if (mark !== "gray") {
                const letter = guess.word[index];
                positiveCounts.set(letter, (positiveCounts.get(letter) || 0) + 1);
            }
        });

        positiveCounts.forEach((count, letter) => {
            minimumLetters.set(letter, Math.max(minimumLetters.get(letter) || 0, count));
        });
    }

    for (const [index, letter] of greenPositions) {
        if (word[index] !== letter) {
            return `Keep ${letter.toUpperCase()} in position ${index + 1}.`;
        }
    }

    for (const position of yellowPositions) {
        const [index, letter] = position.split(":");
        if (word[Number(index)] === letter) {
            return `Move ${letter.toUpperCase()} out of position ${Number(index) + 1}.`;
        }
    }

    const letterCounts = new Map();
    for (const letter of word) {
        letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }
    for (const [letter, count] of minimumLetters) {
        if ((letterCounts.get(letter) || 0) < count) {
            return `Your guess must include ${letter.toUpperCase()}${count > 1 ? ` ${count} times` : ""}.`;
        }
    }
    return "";
}

function updateKeyboard(word, marks) {
    marks.forEach((mark, index) => {
        const button = keyButtons.get(word[index]);
        if (!button) {
            return;
        }
        const priority = { gray: 1, yellow: 2, green: 3 };
        const currentMark = [...button.classList].find((className) => className.startsWith("key--"));
        const currentColor = currentMark?.replace("key--", "");
        if (!currentColor || priority[mark] > priority[currentColor]) {
            button.classList.remove("key--gray", "key--yellow", "key--green");
            button.classList.add(`key--${mark}`);
        }
    });
}

function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function submitGuess() {
    if (gameOver || isRevealing) {
        return;
    }
    if (currentGuess.length !== wordLength) {
        updateMessage(`Enter a ${wordLength}-letter word.`, "message--error");
        return;
    }

    if (hardModeToggle.checked) {
        const violation = checkHardMode(currentGuess);
        if (violation) {
            updateMessage(violation, "message--error");
            return;
        }
    }

    const word = currentGuess;
    const marks = scoreGuess(word);
    const guess = { word, marks, revealedCount: 0 };
    guesses.push(guess);
    currentGuess = "";
    isRevealing = true;
    renderBoard();
    updateCounter();
    updateMessage("Looking good...");

    for (let index = 0; index < wordLength; index++) {
        const cell = boardCells[guesses.length - 1][index];
        cell.classList.add(`tile--${marks[index]}`, "tile--reveal");
        guess.revealedCount = index + 1;
        await wait(260);
        cell.classList.remove("tile--reveal");
    }

    updateKeyboard(word, marks);
    isRevealing = false;

    if (word === answer) {
        gameOver = true;
        renderBoard();
        updateMessage("You Won!", "message--win");
    } else if (guesses.length === maxGuesses) {
        gameOver = true;
        renderBoard();
        updateMessage(`Out of guesses! The answer was ${answer.toUpperCase()}.`, "message--loss");
    } else {
        updateMessage(`${maxGuesses - guesses.length} guesses left.`);
    }
}

function handleKey(key) {
    if (gameOver || isRevealing) {
        return;
    }
    if (key === "Enter") {
        submitGuess();
    } else if (key === "Backspace" || key === "⌫") {
        currentGuess = currentGuess.slice(0, -1);
        renderBoard();
    } else if (/^[a-z]$/i.test(key) && currentGuess.length < wordLength) {
        currentGuess += key.toLowerCase();
        renderBoard();
    }
}

document.addEventListener("keydown", (event) => {
    if (
        event.target instanceof HTMLInputElement
        || event.target instanceof HTMLSelectElement
        || event.target instanceof HTMLButtonElement
    ) {
        return;
    }
    if (/^[a-z]$/i.test(event.key) || event.key === "Enter" || event.key === "Backspace") {
        event.preventDefault();
        handleKey(event.key);
    }
});

wordLengthSelect.addEventListener("change", startNewGame);
hardModeToggle.addEventListener("change", startNewGame);
newGameButton.addEventListener("click", startNewGame);

makeKeyboard();
startNewGame();
