window.Keyboard = class Keyboard {
    constructor(container, onKeyClick) {
        this.container = container;
        this.onKeyClick = onKeyClick;
        this.keys = {};
        this.layout = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.className = 'keyboard';

        this.layout.forEach(rowKeys => {
            const row = document.createElement('div');
            row.className = 'keyboard-row';

            rowKeys.forEach(key => {
                const button = document.createElement('button');
                button.textContent = key;
                button.className = 'key';
                button.setAttribute('data-key', key);

                if (key === 'ENTER') button.classList.add('key-wide');
                if (key === '⌫') {
                    button.classList.add('key-wide');
                    button.textContent = '⌫';
                }

                button.addEventListener('click', () => {
                    const logicKey = key === '⌫' ? 'BACKSPACE' : key;
                    this.onKeyClick(logicKey);
                });

                this.container.appendChild(row);
                row.appendChild(button);

                if (key.length === 1 && key !== '⌫') {
                    this.keys[key] = button;
                }
            });
        });
    }

    updateKeyStatus(key, status) {
        if (!key) return;
        const button = this.keys[key.toUpperCase()];
        if (!button) return;

        const currentStatus = button.getAttribute('data-status');
        const priority = { 'correct': 3, 'present': 2, 'absent': 1, 'empty': 0 };
        const scoreCurrent = priority[currentStatus] || 0;
        const scoreNew = priority[status] || 0;

        if (scoreNew > scoreCurrent) {
            button.setAttribute('data-status', status);
            button.classList.add('key-anim');
            setTimeout(() => button.classList.remove('key-anim'), 300);
        }
    }

    reset() {
        Object.values(this.keys).forEach(btn => {
            btn.removeAttribute('data-status');
        });
    }
};
