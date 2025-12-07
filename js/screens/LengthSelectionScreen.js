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
        let difficultyHtml = '';
        if (this.category === 'general') {
            difficultyHtml = `
                <div style="width:100%; max-width:300px; margin-bottom:20px; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <label for="diff-slider" style="font-weight:bold;">Difficulty</label>
                        <span id="diff-label" style="color:var(--color-correct); font-weight:bold;">Moderate</span>
                    </div>
                    <input type="range" id="diff-slider" min="1" max="5" value="2" style="width:100%; cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; opacity:0.6; margin-top:5px;">
                        <span>Novice</span>
                        <span>Imp.</span>
                    </div>
                </div>
            `;
        }

        this.element.innerHTML = `
            <button class="btn-back-float" id="btn-back-len" style="top:20px; left:20px;" onclick="window.Navigation.show('category-select')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 style="margin-top:40px;">Select Length</h2>
            
            ${difficultyHtml}

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
        // Slider Logic
        const slider = this.element.querySelector('#diff-slider');
        const label = this.element.querySelector('#diff-label');
        let currentDifficulty = 2; // Default Moderate

        if (slider && label) {
            const labels = {
                1: { text: "Novice (Top 5%)", color: "#4ade80" },      // Green
                2: { text: "Easy (5-10%)", color: "#a3e635" },         // Light Green
                3: { text: "Moderate (10-15%)", color: "#facc15" },    // Yellow
                4: { text: "Hard (15-20%)", color: "#fb923c" },        // Orange
                5: { text: "Impossible (20%+)", color: "#ef4444" }     // Red
            };

            const updateLabel = () => {
                const val = parseInt(slider.value);
                currentDifficulty = val;
                label.textContent = labels[val].text;
                label.style.color = labels[val].color;
            };

            slider.addEventListener('input', updateLabel);
            // Init
            updateLabel();
        }

        this.element.querySelectorAll('[data-len]').forEach(btn => {
            btn.onclick = () => {
                const len = parseInt(btn.dataset.len);
                console.log(`Length selected: ${len} for category: ${this.category}, Difficulty: ${currentDifficulty}`);
                if (window.StartGame) {
                    window.StartGame(this.category, len, 'general', null, currentDifficulty);
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
