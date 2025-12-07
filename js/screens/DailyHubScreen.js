window.DailyHubScreen = class DailyHubScreen {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'screen daily-hub-screen';
        this.element.id = 'daily-hub';
        this.element.onShow = () => this.refresh(); // Auto-refresh on navigation
        this.render();
    }

    render() {
        // Clear existing content (important for re-renders)
        this.element.innerHTML = '';

        const stats = window.PersistenceManager.loadStats();
        const completed = stats.dailyProgress ? stats.dailyProgress.completed : [];
        const today = window.PersistenceManager.getTodayString();

        if (stats.dailyProgress && stats.dailyProgress.date !== today) {
            // Logic handled in PersistenceManager, this is just display
        }

        const getStatus = (len) => {
            if (completed.includes(len)) return '<span class="status done">Done ✅</span>';
            return '<span class="status">Not Started</span>';
        };

        this.element.innerHTML = `
            <button class="btn-back-float" id="btn-back-daily" style="top:20px; left:20px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 style="margin-top:40px;">Daily Challenge</h2>
            <div class="daily-list" style="display:flex; flex-direction:column; gap:20px; width:100%; max-width:400px;">
                <button class="glass-panel daily-item" data-len="5" style="width:100%; padding:18px 25px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${completed.includes(5) ? '#4ade80' : 'rgba(255,255,255,0.1)'}; background:${completed.includes(5) ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; text-align:left; transition:transform 0.1s;">
                    <span style="font-size:1.2rem; font-weight:700;">5 Letters</span>
                    ${getStatus(5)}
                </button>
                <button class="glass-panel daily-item" data-len="6" style="width:100%; padding:18px 25px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${completed.includes(6) ? '#4ade80' : 'rgba(255,255,255,0.1)'}; background:${completed.includes(6) ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; text-align:left; transition:transform 0.1s;">
                    <span style="font-size:1.2rem; font-weight:700;">6 Letters</span>
                    ${getStatus(6)}
                </button>
                <button class="glass-panel daily-item" data-len="7" style="width:100%; padding:18px 25px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${completed.includes(7) ? '#4ade80' : 'rgba(255,255,255,0.1)'}; background:${completed.includes(7) ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; text-align:left; transition:transform 0.1s;">
                    <span style="font-size:1.2rem; font-weight:700;">7 Letters</span>
                    ${getStatus(7)}
                </button>
                <button class="glass-panel daily-item" data-len="8" style="width:100%; padding:18px 25px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${completed.includes(8) ? '#4ade80' : 'rgba(255,255,255,0.1)'}; background:${completed.includes(8) ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; text-align:left; transition:transform 0.1s;">
                    <span style="font-size:1.2rem; font-weight:700;">8 Letters</span>
                    ${getStatus(8)}
                </button>
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        this.element.querySelectorAll('.daily-item').forEach(item => {
            item.onclick = () => {
                const len = parseInt(item.dataset.len);
                window.StartGame('general', len, 'daily');
            };
            item.onmouseover = () => item.style.transform = 'scale(1.02)';
            item.onmouseout = () => item.style.transform = 'scale(1)';
        });

        this.element.querySelector('#btn-back-daily').onclick = () => {
            if (window.Navigation) window.Navigation.back();
        };
    }

    getElement() {
        return this.element;
    }

    // Explicit refresh method
    refresh() {
        this.render();
    }
};
