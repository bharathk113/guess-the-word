window.PersistenceManager = class PersistenceManager {
    static get STORE_KEYS() {
        return {
            STATS: 'word_puzzle_stats',
            GAME_STATE: 'word_puzzle_state',
            SETTINGS: 'word_puzzle_settings'
        };
    }

    // Default Stats
    static get initialStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 },
            dailyProgress: {
                date: null,      // "YYYY-MM-DD"
                completed: []    // [5, 6, 7, 8]
            },
            lastPlayedDate: null // For missed day checks
        };
    }

    static loadStats() {
        const data = localStorage.getItem(this.STORE_KEYS.STATS);
        let stats = data ? JSON.parse(data) : this.initialStats;

        // Migration: Ensure dailyProgress exists if loading old stats
        if (!stats.dailyProgress) {
            stats.dailyProgress = { date: null, completed: [] };
        }
        return stats;
    }

    static saveStats(stats) {
        localStorage.setItem(this.STORE_KEYS.STATS, JSON.stringify(stats));
    }

    static getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static checkStreakContinuity(stats) {
        const today = this.getTodayString();

        // If never played, nothing to reset
        if (!stats.lastPlayedDate) return;

        // Calculate days difference
        const last = new Date(stats.lastPlayedDate);
        const curr = new Date(today);
        const diffTime = Math.abs(curr - last);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If missed a day (diff > 1), reset streak
        // Note: If diff is 1 (yesterday), streak is safe
        if (diffDays > 1) {
            console.log("Streak broken due to missed day.");
            stats.currentStreak = 0;
        }
    }

    static updateStats(victory, guessCount, mode = 'general', length = 5) {
        const stats = this.loadStats();
        const today = this.getTodayString();

        // 1. Check Continuity First
        this.checkStreakContinuity(stats);
        stats.lastPlayedDate = today;

        stats.gamesPlayed++;

        if (mode === 'daily') {
            // Reset daily progress if it's a new day
            if (stats.dailyProgress.date !== today) {
                stats.dailyProgress = { date: today, completed: [] };
            }

            if (victory) {
                stats.gamesWon++;

                // Track completion
                if (!stats.dailyProgress.completed.includes(length)) {
                    stats.dailyProgress.completed.push(length);
                }

                // Check for Daily Grand Slam (5, 6, 7, 8)
                const required = [5, 6, 7, 8];
                const allDone = required.every(l => stats.dailyProgress.completed.includes(l));

                // Strict Rule: Increment ONLY if all 4 are done AND not already incremented today
                if (allDone && !stats.dailyProgress.streakIncremented) {
                    console.log("Daily Grand Slam! Streak incremented.");
                    stats.currentStreak++;
                    stats.dailyProgress.streakIncremented = true;
                    if (stats.currentStreak > stats.maxStreak) {
                        stats.maxStreak = stats.currentStreak;
                    }
                }

                if (stats.guesses[guessCount] !== undefined) {
                    stats.guesses[guessCount]++;
                }
            } else {
                // LOSS in Daily

                // CHECK: Did they already complete this length today?
                if (stats.dailyProgress.completed.includes(length)) {
                    console.log(`Daily Challenge (Length ${length}) lost, but already completed today. Streak safe.`);
                    // Do nothing to streak.
                } else {
                    // Strict Streak Reset
                    console.log("Daily Challenge Lost (New Level)! Streak reset to 0.");
                    stats.currentStreak = 0;
                }

                stats.guesses['fail']++;
            }
        } else {
            // General Mode - Just stats, no streak impact
            if (victory) {
                stats.gamesWon++;
                if (stats.guesses[guessCount] !== undefined) {
                    stats.guesses[guessCount]++;
                }
            } else {
                stats.guesses['fail']++;
            }
        }

        this.saveStats(stats);
        return stats;
    }

    static resetStats() {
        this.saveStats(this.initialStats);
    }

    static mergeStats(remoteStats) {
        const localStats = this.loadStats();

        const remotePlayed = remoteStats.gamesPlayed || 0;
        const remoteWon = remoteStats.gamesWon || 0;

        localStats.gamesPlayed += remotePlayed;
        localStats.gamesWon += remoteWon;

        // 2. Streaks (Max)
        const remoteCurrent = remoteStats.currentStreak || 0;
        const remoteMax = remoteStats.longestStreak || remoteStats.maxStreak || 0;

        localStats.currentStreak = Math.max(localStats.currentStreak, remoteCurrent);
        localStats.maxStreak = Math.max(localStats.maxStreak, remoteMax);

        // 3. Guesses (Additive)
        if (remoteStats.guesses) {
            for (let key in localStats.guesses) {
                if (remoteStats.guesses[key]) {
                    localStats.guesses[key] += remoteStats.guesses[key];
                }
            }
        }

        // 4. Daily Progress (Union for today)
        if (remoteStats.dailyProgress) {
            const today = this.getTodayString();
            if (remoteStats.dailyProgress.date === today) {
                // Merge completed arrays
                const set = new Set([...localStats.dailyProgress.completed, ...remoteStats.dailyProgress.completed]);
                localStats.dailyProgress.completed = Array.from(set);
                localStats.dailyProgress.date = today;
                if (remoteStats.dailyProgress.streakIncremented) localStats.dailyProgress.streakIncremented = true;
            } else if (remoteStats.dailyProgress.date > today) {
                localStats.dailyProgress = remoteStats.dailyProgress;
            }
        }

        this.saveStats(localStats);
        return localStats;
    }

    // Non-Additive Sync for Refresh
    static smartSync(remoteStats) {
        const localStats = this.loadStats();

        // 1. Games Played/Won (Max - Trust Remote if Higher)
        const remotePlayed = remoteStats.gamesPlayed || 0;
        const remoteWon = remoteStats.gamesWon || 0;

        localStats.gamesPlayed = Math.max(localStats.gamesPlayed, remotePlayed);
        localStats.gamesWon = Math.max(localStats.gamesWon, remoteWon);

        // 2. Streaks (Max)
        const remoteCurrent = remoteStats.currentStreak || 0;
        const remoteMax = remoteStats.longestStreak || remoteStats.maxStreak || 0;

        localStats.currentStreak = Math.max(localStats.currentStreak, remoteCurrent);
        localStats.maxStreak = Math.max(localStats.maxStreak, remoteMax);

        // 3. Guesses (Max per bucket)
        if (remoteStats.guesses) {
            for (let key in remoteStats.guesses) {
                const rVal = remoteStats.guesses[key] || 0;
                const lVal = localStats.guesses[key] || 0;
                localStats.guesses[key] = Math.max(lVal, rVal);
            }
        }

        // 4. Daily Progress (Union)
        if (remoteStats.dailyProgress) {
            const today = this.getTodayString();
            if (remoteStats.dailyProgress.date === today) {
                const set = new Set([...localStats.dailyProgress.completed, ...remoteStats.dailyProgress.completed]);
                localStats.dailyProgress.completed = Array.from(set);
                if (remoteStats.dailyProgress.streakIncremented) localStats.dailyProgress.streakIncremented = true;
            } else if (remoteStats.dailyProgress.date > today) {
                localStats.dailyProgress = remoteStats.dailyProgress;
            }
        }

        this.saveStats(localStats);
        return localStats;
    }

    // GAME STATE (Fixed: Was missing!)
    static loadGameState() {
        const data = localStorage.getItem(this.STORE_KEYS.GAME_STATE);
        return data ? JSON.parse(data) : null;
    }

    static saveGameState(state) {
        localStorage.setItem(this.STORE_KEYS.GAME_STATE, JSON.stringify(state));
    }

    static clearGameState() {
        localStorage.removeItem(this.STORE_KEYS.GAME_STATE);
    }

    // Settings
    static loadSettings() {
        const data = localStorage.getItem(this.STORE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : { theme: 'dark' };
    }

    static saveSettings(settings) {
        localStorage.setItem(this.STORE_KEYS.SETTINGS, JSON.stringify(settings));
    }
};
