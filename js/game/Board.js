window.Board = class Board {
    constructor(container, wordLength = 5, maxAttempts = 6) {
        this.container = container;
        this.wordLength = wordLength;
        this.maxAttempts = maxAttempts;
        this.grid = [];
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${this.wordLength}, 1fr)`;
        this.container.className = 'game-board';

        for (let r = 0; r < this.maxAttempts; r++) {
            const row = [];
            for (let c = 0; c < this.wordLength; c++) {
                const tile = new window.Tile(); // Access global Tile
                this.container.appendChild(tile.element);
                row.push(tile);
            }
            this.grid.push(row);
        }
    }

    updateTile(row, col, letter) {
        if (this.grid[row] && this.grid[row][col]) {
            this.grid[row][col].setLetter(letter);
        }
    }

    getCurrentGuess(row) {
        if (!this.grid[row]) return "";
        return this.grid[row].map(tile => tile.letter).join('');
    }

    revealRow(row, statuses, animationDelay = 300) {
        if (!this.grid[row]) return;

        const tiles = this.grid[row];
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.setStatus(statuses[index]);
                tile.element.classList.add('flip');
            }, index * animationDelay);
        });
    }

    shakeRow(row) {
        if (!this.grid[row]) return;
        const rowTiles = this.grid[row];
        rowTiles.forEach(tile => {
            tile.element.classList.add('shake');
            setTimeout(() => tile.element.classList.remove('shake'), 500);
        });
    }
};
