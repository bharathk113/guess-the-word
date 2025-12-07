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
            <div style="width:100%; display:flex; align-items:center; justify-content:space-between; padding:15px 20px;">
                
                <!-- Left: Theme Toggle (Fixed Width Container) -->
                <div style="flex:0 0 80px; display:flex; justify-content:flex-start;">
                    <button id="btn-theme-toggle" class="glass-panel" style="width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0; cursor:pointer; border:1px solid rgba(255,255,255,0.2);">
                        <span style="font-size:1.2rem;">${themeIcon}</span>
                    </button>
                </div>

                <!-- Center: User Profile (Flex 1) -->
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                     <div id="user-display" style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👤</div>
                        <div style="font-weight:bold; font-size:0.9rem; opacity:0.9;">Guest</div>
                     </div>
                </div>

                <!-- Right: Login Action (Fixed Width Container) -->
                <div style="flex:0 0 80px; display:flex; justify-content:flex-end;">
                    <button id="btn-login-action" class="btn-outline" style="margin:0; font-size:0.8rem; padding:0 15px; border-radius:20px; height:40px; min-width:70px; display:flex; align-items:center; justify-content:center;">Login</button>
                </div>
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
                <button class="btn-outline" id="btn-stats" style="width:auto; padding:10px 20px; margin-top:10px;">
                    📊 Statistics
                </button>
                <div style="margin-top:20px; text-align:center; font-size:0.8rem; opacity:0.6;">
                    &copy; BR Sports<br>
                    <div style="margin-top:5px; font-size:0.75rem;">
                        Play <a href="https://bharathk113.github.io/tappy-bird" target="_blank" style="color:var(--color-correct); text-decoration:none; font-weight:bold;">Tappy Bird</a>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
        // Check Auth State to update header immediately if already logged in
        if (window.firebaseManager && window.firebaseManager.user) {
            const user = window.firebaseManager.user;
            const userDisplay = this.element.querySelector('#user-display');
            const btnLogin = this.element.querySelector('#btn-login-action');
            if (userDisplay) {
                userDisplay.innerHTML = `
                    <img src="${user.photoURL}" style="width:40px; height:40px; border-radius:50%; border:2px solid var(--accent); object-fit:cover;">
                    <div style="font-weight:bold; font-size:0.9rem; opacity:0.9;">${user.displayName.split(' ')[0]}</div>
                `;
            }
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

        const btnStats = this.element.querySelector('#btn-stats');
        if (btnStats) {
            btnStats.addEventListener('click', () => {
                window.Navigation.show('stats-screen');
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
