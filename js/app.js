console.log("Word Puzzle Game Initialized (Refactored)");

window.addEventListener('load', async () => {
    // 1. Hide Splash
    const splash = document.getElementById('splash-screen');
    if (splash) splash.remove(); // Safest way to ensure no overlay

    // 2. Check Dependencies
    if (!window.Navigation || !window.HomeScreen || !window.Modal) {
        alert("Critical Error: Scripts not loaded.");
        return;
    }

    // 3. Initialize Navigation
    window.Navigation.init();

    // DEBUG: Log all clicks to identify what's capturing them
    document.body.addEventListener('click', (e) => {
        // console.log('Global Click Debug:', e.target, 'Path:', e.composedPath());
        // Highlight the clicked element momentarily
        const target = e.target;
        const prevOutline = target.style.outline;
        // target.style.outline = '2px solid red';
        // setTimeout(() => target.style.outline = prevOutline, 200);
    }, true); // Capture phase

    // 4. Initialize Theme
    const initTheme = () => {
        const settings = window.PersistenceManager.loadSettings();
        if (settings.theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    };
    initTheme();

    window.toggleTheme = () => {
        const isLight = document.body.classList.toggle('light-mode');
        const theme = isLight ? 'light' : 'dark';

        // Save
        const settings = window.PersistenceManager.loadSettings();
        settings.theme = theme;
        window.PersistenceManager.saveSettings(settings);

        // Update Icon (if button exists)
        const btn = document.getElementById('btn-theme-toggle');
        if (btn) btn.innerHTML = isLight ? '☀️' : '🌙';
    };

    // Init global modal
    const modal = new window.Modal();

    // Init Firebase (Safely)
    try {
        if (window.FirebaseManager) {
            window.firebaseManager = new window.FirebaseManager();
        } else {
            console.warn("FirebaseManager class not found. Guest mode only.");
        }
    } catch (e) {
        console.error("Firebase init failed:", e);
    }

    const container = document.getElementById('app');

    // --- REGISTER SCREENS ---

    // Home
    const homeScreen = new window.HomeScreen();
    window.homeScreen = homeScreen; // Expose for updates
    container.appendChild(homeScreen.getElement());
    window.Navigation.register('home', homeScreen.getElement());

    // Category Selection
    if (window.CategoryScreen) {
        const catScreen = new window.CategoryScreen();
        container.appendChild(catScreen.getElement());
        window.Navigation.register('category-select', catScreen.getElement());
    }

    // Length Selection
    if (window.LengthScreen) {
        const lenScreen = new window.LengthScreen();
        container.appendChild(lenScreen.getElement());
        window.Navigation.register('length-select', lenScreen.getElement());
    }

    // Daily Hub
    if (window.DailyHubScreen) {
        const dailyScreen = new window.DailyHubScreen();
        window.dailyHubScreen = dailyScreen; // Expose for updates
        container.appendChild(dailyScreen.getElement());
        window.Navigation.register('daily-hub', dailyScreen.getElement());
    }

    // Stats Screen
    if (window.StatsScreen) {
        const statsScreen = new window.StatsScreen();
        container.appendChild(statsScreen.getElement());
        window.Navigation.register('stats-screen', statsScreen.getElement());
    }

    // Game Screen (Wrapper)
    const gameWrapper = document.createElement('div');
    gameWrapper.id = 'game-screen';
    gameWrapper.className = 'screen';
    gameWrapper.style.flexDirection = 'column';
    gameWrapper.style.alignItems = 'center';
    gameWrapper.style.padding = '20px 0';
    container.appendChild(gameWrapper);
    window.Navigation.register('game', gameWrapper);

    // Build Game UI inside Wrapper
    const header = document.createElement('h1');
    header.textContent = "WordGame";
    header.style.marginBottom = "20px";
    gameWrapper.appendChild(header);

    const boardContainer = document.createElement('div');
    gameWrapper.appendChild(boardContainer);

    const keyboardContainer = document.createElement('div');
    gameWrapper.appendChild(keyboardContainer);

    // Back Button for Game (Floating)
    const btnBack = document.createElement('button');
    btnBack.className = 'btn-back-float';
    btnBack.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
    btnBack.onclick = () => window.Navigation.back();
    gameWrapper.appendChild(btnBack);

    // --- GAME LAUNCHER LOGIC ---
    window.StartGame = async (category = 'general', length = 5, mode = 'general', forcedSolution = null, difficulty = null) => {
        boardContainer.innerHTML = '';
        keyboardContainer.innerHTML = '';

        const WordService = window.WordService;
        const PersistenceManager = window.PersistenceManager;
        const Board = window.Board;
        const Keyboard = window.Keyboard;
        const GameLogic = window.GameLogic;

        // Load data
        const data = await WordService.getWords(category, length);
        if (!data) {
            modal.show("Error", "Could not load words!", "OK");
            return;
        }

        let solution;
        if (forcedSolution) {
            solution = forcedSolution;
        } else if (mode === 'daily') {
            solution = WordService.getDailySolution(data.solutions, length);
        } else {
            // General Random with Difficulty
            const allSolutions = data.solutions;

            // Default to 'Moderate' (2) or random if not provided, but usually provided now.
            // If difficulty is null (e.g. from generic retry), pick random from entire pool? 
            // Or default to 2? Let's default to full random if null, or respect passed value.

            let pool = allSolutions;

            if (difficulty && category === 'general') {
                const total = allSolutions.length;
                const bucketSize = Math.floor(total / 5);
                // 1=Easy (Top), 5=Impossible (Bottom)
                // Assuming list is sorted by frequency (Common -> Rare)
                const start = (difficulty - 1) * bucketSize;
                let end = start + bucketSize;
                if (difficulty === 5) end = total; // Ensure we get the tail

                pool = allSolutions.slice(start, end);
                console.log(`Difficulty ${difficulty}: Picking from range ${start}-${end} (Total: ${total})`);
            }

            if (pool.length === 0) pool = allSolutions; // Fallback
            solution = pool[Math.floor(Math.random() * pool.length)];
        }

        let restoring = false;
        if (!forcedSolution) { // Don't restore if we are forcing a retry
            const savedState = PersistenceManager.loadGameState();
            // If saved game exists and solution matches (same day/mode), restore it
            if (savedState && savedState.solution === solution && savedState.status === 'IN_PROGRESS') {
                console.log("Resuming saved game...");
                restoring = true;
            } else {
                PersistenceManager.clearGameState();
            }
        }

        console.log(`Starting game: ${length} letters. Solution: ${solution}`);

        // Update Header
        header.textContent = mode === 'daily' ? `Daily Challenge` : `Guess the Word`;

        const maxRows = length + 1; // Dynamic Guesses
        const board = new Board(boardContainer, length, maxRows);
        let gameLogic;

        const keyboard = new Keyboard(keyboardContainer, (key) => {
            if (gameLogic) gameLogic.handleInput(key);
        });

        // PHYSICAL KEYBOARD SUPPORT
        if (window.handlePhysicalKey) {
            document.removeEventListener('keydown', window.handlePhysicalKey);
        }

        window.handlePhysicalKey = (e) => {
            if (!gameLogic || window.Navigation.currentScreen !== 'game') return;

            const key = e.key.toUpperCase();
            if (key === 'ENTER') {
                gameLogic.handleInput('ENTER');
            } else if (key === 'BACKSPACE') {
                gameLogic.handleInput('BACKSPACE');
            } else if (/^[A-Z]$/.test(key)) {
                gameLogic.handleInput(key);
            }
        };
        document.addEventListener('keydown', window.handlePhysicalKey);

        const handleGameEnd = (won, guesses) => {
            console.log(`HandleGameEnd: ${won ? 'WON' : 'LOST'} in ${guesses} guesses`);

            // 1. Update Stats
            let newStats = { currentStreak: 0 };
            try {
                newStats = PersistenceManager.updateStats(won, guesses, mode, length);
                console.log("Stats updated successfully");
            } catch (e) {
                console.error("Stats Error: " + e.message);
            }

            // Sync
            if (window.firebaseManager) window.firebaseManager.saveStatsToFirestore(newStats);

            // 2. Clear Persistence
            PersistenceManager.saveGameState({
                solution: solution,
                status: won ? 'WON' : 'LOST',
                guesses: gameLogic.guessHistory,
                lastPlayedTs: Date.now()
            });

            // 3. SHOW MODAL
            let title = won ? "Victory! 🏆" : "Game Over";
            let msg;
            let customButtons = [];

            // Helper to restart
            const restart = (forceSame) => {
                PersistenceManager.clearGameState();
                window.StartGame(category, length, mode, forceSame ? solution : null);
            };

            if (!won) {
                console.log("Processing Loss Condition...");
                if (mode === 'daily') {
                    // Daily Loss
                    const stats = PersistenceManager.loadStats();
                    const isSafe = stats.dailyProgress.completed.includes(length);

                    title = "Challenge Failed";
                    if (isSafe) {
                        msg = `The word will remain hidden.<br><br><div style="color:#4ade80; font-weight:bold;">Streak Safe (Replay Mode) 🛡️</div>`;
                    } else {
                        msg = `The word will remain hidden.<br><br><div style="color:#ef4444; font-weight:bold;">Streak Reset to 0 💔</div>`;
                    }

                    customButtons = [
                        { text: "Daily Menu", class: "btn-primary", onClick: () => window.Navigation.show('daily-hub') },
                        { text: "Main Menu", class: "btn-secondary", onClick: () => window.Navigation.show('home') }
                    ];
                } else {
                    // Unlimited Loss
                    title = "So Close!";
                    const maskedWord = "*****";

                    msg = `
                        The word was: <span id="reveal-word" style="font-family:monospace; letter-spacing:2px; font-weight:bold; cursor:pointer; text-decoration:underline;">${maskedWord}</span>
                        <div style="font-size:0.8rem; margin-top:5px; opacity:0.7;">(Tap to reveal)</div>
                    `;

                    customButtons = [
                        { text: "Try Again", class: "btn-secondary", onClick: () => restart(true) },
                        { text: "New Word", class: "btn-primary", onClick: () => restart(false) },
                        { text: "Main Menu", class: "btn-outline", onClick: () => window.Navigation.show('home') }
                    ];
                }
            } else {
                // WIN
                msg = `Solved in ${guesses} guesses!`;
                if (mode === 'daily') {
                    if (newStats.dailyProgress.streakIncremented) {
                        msg += `<br><br><div style="color:#4ade80;">Grand Slam! Streak: ${newStats.currentStreak} 🔥</div>`;
                    } else {
                        const stats = PersistenceManager.loadStats();
                        const allDone = [5, 6, 7, 8].every(l => stats.dailyProgress.completed.includes(l));
                        if (allDone) {
                            msg += `<br><div style="font-size:0.9rem; margin-top:10px; color:#4ade80;">All Daily Challenges Complete! ✅</div>`;
                        } else {
                            msg += `<br><div style="font-size:0.9rem; margin-top:10px;">Complete all daily challenges to increase streak!</div>`;
                        }
                    }
                    customButtons = [
                        { text: "Daily Menu", class: "btn-primary", onClick: () => window.Navigation.show('daily-hub') }
                    ];
                } else {
                    customButtons = [
                        { text: "Try New Word", class: "btn-primary", onClick: () => restart(false) },
                        { text: "Main Menu", class: "btn-outline", onClick: () => window.Navigation.show('home') }
                    ];
                }
            }

            console.log(`Attempting to show modal: ${title}`);
            try {
                // Show modal with custom buttons
                modal.show(title, msg, null, null, null, customButtons);

                // Attach Reveal Listener
                if (!won && mode !== 'daily') {
                    setTimeout(() => {
                        const revealSpan = document.getElementById('reveal-word');
                        if (revealSpan) {
                            revealSpan.onclick = () => {
                                if (confirm("Are you sure you want to see the word?")) {
                                    revealSpan.textContent = solution;
                                    revealSpan.style.textDecoration = 'none';
                                    console.log("User revealed word.");
                                }
                            };
                        }
                    }, 100);
                }

                // Double Check Visibility
                const overlay = document.querySelector('.modal-overlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                    overlay.classList.add('active');
                }
            } catch (err) {
                console.error("Modal Error: " + err.message);
                alert("Game Over! " + (won ? "Win" : "Lose"));
            }
        };

        gameLogic = new GameLogic(
            solution,
            data.allowed,
            board,
            keyboard,
            (guesses) => handleGameEnd(true, guesses),
            (sol) => handleGameEnd(false, 0),
            (state) => {
                PersistenceManager.saveGameState({
                    solution: solution,
                    guesses: state.guesses,
                    status: state.status,
                    lastPlayedTs: Date.now()
                });
            }
        );

        if (restoring) {
            gameLogic.loadState(savedState.guesses);
        }

        window.Navigation.show('game');
    };

    // Show Home
    window.Navigation.show('home');
});
