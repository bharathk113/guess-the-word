window.LengthScreen = class LengthScreen {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'screen length-screen';
        this.element.id = 'length-screen';
        this.category = 'general'; // Default 
        this.render();
    }

    onShow(props) {
        if (props.category) this.category = props.category;
    }

    render() {
        this.element.innerHTML = `
            <button class="btn-back-float" id="btn-back-len" style="top:20px; left:20px;">&#8592;</button>
            <h2 style="margin-top:40px;">Select Length</h2>
            <div class="length-grid" style="display:flex; flex-direction:column; gap:15px; width:100%; max-width:300px;">
                <button class="btn-secondary" data-len="5" style="white-space:nowrap;">5 Letters</button>
                <button class="btn-secondary" data-len="6" style="white-space:nowrap;">6 Letters</button>
                <button class="btn-secondary" data-len="7" style="white-space:nowrap;">7 Letters</button>
                <button class="btn-secondary" data-len="8" style="white-space:nowrap;">8 Letters</button>
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        this.element.querySelectorAll('[data-len]').forEach(btn => {
            btn.onclick = () => {
                const len = parseInt(btn.dataset.len);
                console.log(`Length selected: ${len} for category: ${this.category}`);
                if (window.StartGame) {
                    window.StartGame(this.category, len);
                } else {
                    console.error("StartGame function not found!");
                    alert("Error: Game Launcher not found.");
                }
            };
        });

        this.element.querySelector('#btn-back-len').onclick = () => {
            window.Navigation.show('category-select');
        };
    }

    getElement() {
        return this.element;
    }
};
