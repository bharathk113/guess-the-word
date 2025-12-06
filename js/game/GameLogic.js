window.GameLogic = class GameLogic {
    constructor(solution, allowedWords, board, keyboard, onWin, onFail, onUpdate) {
        this.solution = solution.toUpperCase();

        if (allowedWords instanceof Set) {
            this.allowedWords = allowedWords;
        } else if (Array.isArray(allowedWords)) {
            this.allowedWords = new Set(allowedWords.map(w => w.toUpperCase()));
        } else {
            console.error("GameLogic: Invalid allowedWords type", allowedWords);
            this.allowedWords = new Set();
        }
        this.board = board;
        this.keyboard = keyboard;
        this.onWin = onWin;
        this.onFail = onFail;
        this.onUpdate = onUpdate; // Persistence hook

        this.currentRowIndex = 0;
        this.currentTileIndex = 0;
        this.guessHistory = [];
        this.gameStatus = 'IN_PROGRESS'; // IN_PROGRESS, WON, LOST

        this.maxRows = board.maxAttempts; // FIX: Property name mismatch resolved
        this.wordLength = board.wordLength;
    }

    // Restore game from state
    loadState(guesses) {
        if (!guesses || guesses.length === 0) return;

        guesses.forEach(guess => {
            // Replay state
            for (let i = 0; i < guess.length; i++) {
                this.handleInput(guess[i]);
            }
            this.submitGuess(true); // true = restoring
        });
    }

    handleInput(key) {
        if (this.gameStatus !== 'IN_PROGRESS') return;

        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.removeLetter();
        } else if (/^[A-Z]$/.test(key)) {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        const currentGuess = this.board.getCurrentGuess(this.currentRowIndex);
        if (currentGuess.length < this.wordLength) {
            this.board.updateTile(this.currentRowIndex, currentGuess.length, letter);
        }
    }

    removeLetter() {
        const currentGuess = this.board.getCurrentGuess(this.currentRowIndex);
        if (currentGuess.length > 0) {
            this.board.updateTile(this.currentRowIndex, currentGuess.length - 1, '');
        }
    }

    submitGuess(restoring = false) {
        const guess = this.board.getCurrentGuess(this.currentRowIndex);
        if (guess.length !== this.wordLength) {
            if (!restoring) {
                this.showToast("Not enough letters");
                this.board.shakeRow(this.currentRowIndex);
            }
            return;
        }

        if (!this.allowedWords.has(guess)) {
            if (!restoring) {
                this.showToast("Not in word list");
                this.board.shakeRow(this.currentRowIndex);
            }
            return; // Stop if invalid word
        }

        // Evaluate
        const evaluation = this.evaluateGuess(guess);
        this.board.revealRow(this.currentRowIndex, evaluation);
        this.updateKeyboard(guess, evaluation);

        this.guessHistory.push(guess);

        // Win/Loss
        if (guess === this.solution) {
            this.gameStatus = 'WON';
            if (this.onWin && !restoring) this.onWin(this.guessHistory.length);
        } else if (this.currentRowIndex >= this.maxRows - 1) {
            this.gameStatus = 'LOST';
            if (this.onFail && !restoring) this.onFail(this.solution);
        } else {
            this.currentRowIndex++;
            this.currentTileIndex = 0;
        }

        // Trigger Persistence Update
        if (this.onUpdate) {
            this.onUpdate({
                guesses: this.guessHistory,
                status: this.gameStatus,
                solution: this.solution
            });
        }
    }

    evaluateGuess(guess) {
        const solutionChars = this.solution.split('');
        const guessChars = guess.split('');
        const result = new Array(guess.length).fill('absent');

        // First pass: Correct
        guessChars.forEach((char, i) => {
            if (char === solutionChars[i]) {
                result[i] = 'correct';
                solutionChars[i] = null;
                guessChars[i] = null;
            }
        });

        // Second pass: Present
        guessChars.forEach((char, i) => {
            if (char !== null) {
                const indexInSolution = solutionChars.indexOf(char);
                if (indexInSolution > -1) {
                    result[i] = 'present';
                    solutionChars[indexInSolution] = null;
                }
            }
        });

        return result;
    }

    updateKeyboard(guess, result) {
        guess.split('').forEach((char, i) => {
            this.keyboard.updateKeyStatus(char, result[i]);
        });
    }

    showToast(msg) {
        console.log("Toast:", msg);
        let toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
};
