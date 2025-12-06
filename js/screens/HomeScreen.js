window.HomeScreen = class HomeScreen {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'screen home-screen';
        this.element.id = 'home-screen';
        this.element.onShow = () => this.render(); // Auto-refresh on navigation
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        const stats = window.PersistenceManager.loadStats();
        const winPct = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

        // Header with Login/Logout + Theme Toggle
        const settings = window.PersistenceManager.loadSettings();
        const themeIcon = settings.theme === 'light' ? '☀️' : '🌙';

        const headerHtml = `
            <div style="width:100%; display:flex; justify-content:space-between; padding:10px 20px; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <button id="btn-theme-toggle" class="btn-outline" style="margin:0; padding:6px 12px; border-radius:50%; font-size:1.2rem; border:none;">${themeIcon}</button>
                    <div id="user-display" style="font-weight:bold; font-size:0.9rem; opacity:0.8;">Guest</div>
                </div>
                <button id="btn-login-action" class="btn-outline" style="margin:0; font-size:0.8rem; padding:8px 16px; width:auto; border-radius:20px;">Login</button>
            </div>
        `;

        // Stats Card
        const statsHtml = `
            <div class="stats-card" style="background:rgba(255,255,255,0.05); border-radius:12px; padding:15px; margin:20px 0; width:90%; display:flex; justify-content:space-around;">
                <div style="text-align:center;">
                    <div style="font-size:1.5rem; font-weight:800; color:var(--accent);">${stats.gamesPlayed}</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Played</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:1.5rem; font-weight:800; color:var(--color-correct);">${winPct}%</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Win %</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:1.5rem; font-weight:800; color:var(--color-present);">${stats.currentStreak}</div>
                    <div style="font-size:0.8rem; opacity:0.7;">Streak</div>
                </div>
            </div>
        `;

        this.element.innerHTML = `
            ${headerHtml}
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
                <div class="logo-large" style="margin-bottom:10px;">Guess the Word</div>
                
                ${statsHtml}

                <button class="btn-primary" id="btn-daily">
                    <span class="icon">📅</span> Daily Challenge
                </button>
                <button class="btn-secondary" id="btn-unlimited">
                    <span class="icon">♾️</span> Unlimited Mode
                </button>
                <div style="margin-top:20px; text-align:center; font-size:0.8rem; opacity:0.5;">
                    v11 - Premium Edition
                </div>
            </div>
        `;

        this.attachEvents();
        // Check Auth State to update header immediately if already logged in
        if (window.firebaseManager && window.firebaseManager.user) {
            const user = window.firebaseManager.user;
            const userDisplay = this.element.querySelector('#user-display');
            const btnLogin = this.element.querySelector('#btn-login-action');
            if (userDisplay) userDisplay.innerHTML = `<img src="${user.photoURL}" style="width:24px;border-radius:50%;vertical-align:middle;margin-right:8px"> ${user.displayName.split(' ')[0]}`;
            if (btnLogin) btnLogin.textContent = "Logout";
        }
    }

    // Refresh Method
    updateUI() {
        this.render();
    }

    attachEvents() {
        console.log("HomeScreen: Attaching events...");

        const btnDaily = this.element.querySelector('#btn-daily');
        if (btnDaily) {
            btnDaily.addEventListener('click', () => {
                window.Navigation.show('daily-hub');
            });
        }

        const btnUnlimited = this.element.querySelector('#btn-unlimited');
        if (btnUnlimited) {
            btnUnlimited.addEventListener('click', () => {
                window.Navigation.show('category-select');
            });
        }

        // Login/Logout Action
        const btnLoginAction = this.element.querySelector('#btn-login-action');
        if (btnLoginAction) {
            btnLoginAction.addEventListener('click', async () => {
                const isLogout = btnLoginAction.textContent === 'Logout';

                if (window.firebaseManager) {
                    if (isLogout) {
                        window.firebaseManager.logout();
                    } else {
                        btnLoginAction.textContent = "...";
                        btnLoginAction.disabled = true;
                        try {
                            await window.firebaseManager.login();
                        } catch (e) {
                            console.error("Login Error:", e);
                            btnLoginAction.textContent = "Login";
                        } finally {
                            btnLoginAction.disabled = false;
                        }
                    }
                }
            });
        }

        // Theme Toggle
        const btnTheme = this.element.querySelector('#btn-theme-toggle');
        if (btnTheme) {
            btnTheme.addEventListener('click', () => {
                window.toggleTheme();
            });
        }
    }

    getElement() {
        return this.element;
    }
};
