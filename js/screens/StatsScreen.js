window.StatsScreen = class StatsScreen {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'screen stats-screen';
        this.element.id = 'stats-screen';
        this.element.style.overflowY = 'auto';
        this.element.style.justifyContent = 'flex-start';
        this.element.style.paddingTop = '60px';

        this.activeTab = 'all'; // Default view
        this.render();
    }

    onShow() {
        this.activeTab = 'all'; // Reset on open
        this.render();
    }

    render() {
        const stats = window.PersistenceManager.loadStats();

        // Define Data Source based on Tab
        let displayStats = {
            played: stats.gamesPlayed,
            won: stats.gamesWon,
            guesses: stats.guesses
        };

        if (this.activeTab !== 'all' && stats.lengthStats && stats.lengthStats[this.activeTab]) {
            displayStats = stats.lengthStats[this.activeTab];
        } else if (this.activeTab !== 'all') {
            // Fallback if empty
            displayStats = { played: 0, won: 0, guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 } };
        }

        // Calcs
        const winPct = displayStats.played > 0 ? Math.round((displayStats.won / displayStats.played) * 100) : 0;
        const maxGuess = Math.max(...Object.values(displayStats.guesses));

        // Graph Generator
        const createBar = (val, max, label) => {
            const pct = max > 0 ? (val / max) * 100 : 0;
            return `
                <div style="display:flex; align-items:center; margin-bottom:4px; font-size:0.9rem;">
                    <span style="width:15px; text-align:right; margin-right:8px; opacity:0.7;">${label}</span>
                    <div style="flex:1; background:rgba(255,255,255,0.05); height:22px;">
                        <div style="width:${pct}%; background:${label === 'X' ? '#ef4444' : '#4ade80'}; height:100%; min-width:${val > 0 ? '20px' : '0'}; display:flex; align-items:center; justify-content:flex-end; padding-right:5px; color:#000; font-weight:bold; font-size:0.8rem;">
                            ${val > 0 ? val : ''}
                        </div>
                    </div>
                </div>
            `;
        };

        // Table Rows (Only relevant for ALL view usually, but we can show subset)
        // If viewing specific length, Difficulty stats might not track length perfectly unless we upgraded that too.
        // For now, I'll hide Breakdown tables on specific length tabs to keep it clean, or just show them as "Global Context".
        // Use Case: User wants to see "5 Letter Stats". Breakdown by category is still relevant.
        // But our `categoryStats` and `difficultyStats` are NOT segmented by length in `PersistenceManager`.
        // So showing them when filtered by length is misleading. I will hide Breakdown tables when not 'all'.

        const showTables = this.activeTab === 'all';

        // Table Logic (Reused)
        const genRow = (label, played, won) => {
            const pct = played > 0 ? Math.round((won / played) * 100) : 0;
            return `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="flex:2;">${label}</span>
                    <span style="flex:1; text-align:center;">${played}</span>
                    <span style="flex:1; text-align:right;">${pct}%</span>
                </div>
            `;
        };

        let breakdownHtml = '';
        if (showTables) {
            const diffLabels = { 1: "Novice", 2: "Easy", 3: "Moderate", 4: "Hard", 5: "Impossible" };
            let diffRows = '';
            if (stats.difficultyStats) {
                for (let i = 1; i <= 5; i++) {
                    const s = stats.difficultyStats[i];
                    diffRows += genRow(diffLabels[i], s.played, s.won);
                }
            }
            let catRows = '';
            if (stats.categoryStats) {
                catRows += genRow("General", stats.categoryStats.general.played, stats.categoryStats.general.won);
                catRows += genRow("Daily", stats.categoryStats.daily.played, stats.categoryStats.daily.won);
            }

            breakdownHtml = `
                <div style="width:100%; max-width:400px; margin-bottom:20px;">
                     <h3 style="margin-bottom:15px; font-size:1.1rem;">Performance Breakdown</h3>
                     <div class="glass-panel" style="padding:15px; font-size:0.9rem;">
                        <div style="display:flex; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:5px; opacity:0.7; font-weight:bold;">
                            <span style="flex:2;">Mode</span>
                            <span style="flex:1; text-align:center;">Played</span>
                            <span style="flex:1; text-align:right;">Win %</span>
                        </div>
                        ${catRows}
                     </div>
                </div>
                
                <div style="width:100%; max-width:400px; margin-bottom:40px;">
                     <div class="glass-panel" style="padding:15px; font-size:0.9rem;">
                        <div style="display:flex; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:5px; opacity:0.7; font-weight:bold;">
                            <span style="flex:2;">Difficulty</span>
                            <span style="flex:1; text-align:center;">Played</span>
                            <span style="flex:1; text-align:right;">Win %</span>
                        </div>
                        ${diffRows}
                     </div>
                </div>
            `;
        } else {
            breakdownHtml = `<div style="opacity:0.6; font-size:0.9rem; margin-bottom:30px;">(Global breakdown only available in 'All' view)</div>`;
        }

        // Tab Generator
        const createTab = (id, label) => {
            const isActive = this.activeTab == id; // Loose equality for string/number
            const bg = isActive ? 'var(--color-correct)' : 'rgba(255,255,255,0.1)';
            const color = isActive ? '#000' : '#fff';
            return `<button class="stat-tab" data-id="${id}" style="background:${bg}; color:${color}; border:none; padding:8px 16px; border-radius:20px; font-weight:bold; cursor:pointer; flex:1; font-size:0.9rem;">${label}</button>`;
        };

        this.element.innerHTML = `
            <button class="btn-back-float" style="top:20px; left:20px;" onclick="window.Navigation.show('home')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            
            <h2 style="margin-bottom:20px;">Statistics</h2>

            <div style="display:flex; gap:10px; margin-bottom:20px; width:100%; max-width:400px;">
                ${createTab('all', 'All')}
                ${createTab(5, '5')}
                ${createTab(6, '6')}
                ${createTab(7, '7')}
                ${createTab(8, '8')}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; width:100%; max-width:400px; margin-bottom:30px;">
                <div class="glass-panel" style="padding:15px; text-align:center;">
                    <div style="font-size:2rem; font-weight:800; color:var(--color-text);">${displayStats.played}</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Played</div>
                </div>
                <div class="glass-panel" style="padding:15px; text-align:center;">
                    <div style="font-size:2rem; font-weight:800; color:var(--color-text);">${winPct}%</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Win Rate</div>
                </div>
                ${this.activeTab === 'all' ? `
                <div class="glass-panel" style="padding:15px; text-align:center;">
                    <div style="font-size:2rem; font-weight:800; color:var(--color-text);">${stats.currentStreak}</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Current Streak</div>
                </div>
                 <div class="glass-panel" style="padding:15px; text-align:center;">
                    <div style="font-size:2rem; font-weight:800; color:var(--color-text);">${stats.maxStreak}</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Max Streak</div>
                </div>` : ''}
            </div>

            <div style="width:100%; max-width:400px; margin-bottom:30px;">
                <h3 style="margin-bottom:15px; font-size:1.1rem;">Guess Distribution (${this.activeTab === 'all' ? 'Overall' : this.activeTab + ' Letters'})</h3>
                ${createBar(displayStats.guesses[1], maxGuess, '1')}
                ${createBar(displayStats.guesses[2], maxGuess, '2')}
                ${createBar(displayStats.guesses[3], maxGuess, '3')}
                ${createBar(displayStats.guesses[4], maxGuess, '4')}
                ${createBar(displayStats.guesses[5], maxGuess, '5')}
                ${createBar(displayStats.guesses[6], maxGuess, '6')}
                ${createBar(displayStats.guesses[7] || 0, maxGuess, '7')}
                ${createBar(displayStats.guesses[8] || 0, maxGuess, '8')}
                ${createBar(displayStats.guesses[9] || 0, maxGuess, '9')}
                ${createBar(displayStats.guesses.fail, maxGuess, 'X')}
            </div>

            ${breakdownHtml}
        `;

        // Attach Tab Events
        this.element.querySelectorAll('.stat-tab').forEach(btn => {
            btn.onclick = () => {
                this.activeTab = btn.dataset.id;
                this.render();
            };
        });
    }

    getElement() {
        return this.element;
    }
};
