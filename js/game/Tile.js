window.Tile = class Tile {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'tile';
        this.letter = '';
        this.status = 'empty';
        this.render();
    }

    setLetter(letter) {
        this.letter = letter;
        this.status = letter ? 'tbd' : 'empty';
        this.update();
    }

    setStatus(status) {
        this.status = status;
        this.update();
    }

    update() {
        this.element.textContent = this.letter;
        this.element.setAttribute('data-status', this.status);

        if (this.status === 'tbd' && this.letter) {
            this.element.classList.add('pop');
            setTimeout(() => this.element.classList.remove('pop'), 100);
        }
    }

    render() {
        this.element.innerHTML = '';
        this.update();
        return this.element;
    }
};
