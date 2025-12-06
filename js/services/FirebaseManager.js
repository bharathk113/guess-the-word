window.FirebaseManager = class FirebaseManager {
    constructor() {
        this.config = {
            apiKey: "AIzaSyBvzagUy3z2A4qUKNjRxCPpeqxVyETraxk",
            authDomain: "guess-the-word-br.firebaseapp.com",
            projectId: "guess-the-word-br",
            storageBucket: "guess-the-word-br.firebasestorage.app",
            messagingSenderId: "762373249410",
            appId: "1:762373249410:web:448fdd36570f6cbea3579b",
            measurementId: "G-DY2C3DECJL"
        };

        this.auth = null;
        this.db = null;
        this.user = null;
        this.userRef = null;

        // Init
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(this.config);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            console.log("Firebase Initialized");

            // Auth Listener
            this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
        } else {
            console.error("Firebase SDK not loaded!");
        }
    }

    async login() {
        if (!this.auth) return;
        const provider = new firebase.auth.GoogleAuthProvider();
        // Force account selection prompt
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            await this.auth.signInWithPopup(provider);
        } catch (error) {
            console.error("Login failed:", error);
            if (error.code === 'auth/popup-blocked') {
                alert("Login Popup was blocked! Please allow popups for this site.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.warn("User closed login popup");
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.warn("Duplicate popup request ignored");
            } else {
                alert("Login Error: " + error.message);
            }
        }
    }

    async logout() {
        if (!this.auth) return;
        try {
            await this.auth.signOut();
            // Clear local stats & sync flag
            window.PersistenceManager.resetStats();
            localStorage.removeItem('is_auth_synced');
            // Refresh UI
            window.location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    async onAuthStateChanged(user) {
        this.user = user;

        // Use Global HomeScreen Instance if available for updates
        if (window.homeScreen) window.homeScreen.updateUI();

        if (user) {
            console.log("User logged in:", user.uid);
            this.userRef = this.db.collection('users').doc(user.uid);

            // Sync Data
            await this.syncStats();

            // Re-update UI after sync to show changes (CRITICAL FIX for delayed updates)
            if (window.homeScreen) window.homeScreen.updateUI();

        } else {
            console.log("User logged out");
            this.userRef = null;
        }
    }

    async syncStats() {
        if (!this.userRef) return;

        // 1. Load Local
        const localStats = window.PersistenceManager.loadStats();

        // 2. Load Remote
        try {
            const doc = await this.userRef.get();
            if (doc.exists) {
                const remoteData = doc.data();
                const remoteStats = remoteData.stats || {};

                console.log("Syncing from Remote...", remoteStats);

                const isSynced = localStorage.getItem('is_auth_synced');
                let mergedStats;

                if (isSynced === 'true') {
                    // Subsequent Refreshes: Smart Sync (Non-Additive)
                    console.log("Session already synced. Performing Smart Sync (Non-Additive).");
                    mergedStats = window.PersistenceManager.smartSync(remoteStats);
                } else {
                    // First Login: Additive Merge
                    console.log("First Login Sync. Performing Additive Merge.");
                    mergedStats = window.PersistenceManager.mergeStats(remoteStats);
                    localStorage.setItem('is_auth_synced', 'true');
                }

                // SAVE Merged back to Firestore (Two-way sync)
                await this.saveStatsToFirestore(mergedStats);

            } else {
                // First time user? Create doc with current local stats
                // Also mark as synced
                await this.saveStatsToFirestore(localStats);
                localStorage.setItem('is_auth_synced', 'true');
            }
        } catch (e) {
            console.error("Sync Error", e);
        }
    }

    async saveStatsToFirestore(localStats) {
        if (!this.userRef) return;

        // Convert to User Prompt Structure
        const firestoreData = {
            stats: {
                currentStreak: localStats.currentStreak,
                longestStreak: localStats.maxStreak,
                lastDailyDate: localStats.dailyProgress ? localStats.dailyProgress.date : null,
                gamesPlayed: localStats.gamesPlayed,
                gamesWon: localStats.gamesWon,
                dailyProgress: localStats.dailyProgress, // Sync full daily progress too
                guesses: localStats.guesses // Sync guesses distribution
            }
        };

        try {
            await this.userRef.set(firestoreData, { merge: true });
            console.log("Stats saved to Firestore");
        } catch (e) {
            console.error("Save to Firestore failed", e);
        }
    }
};
