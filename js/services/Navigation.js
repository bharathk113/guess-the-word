window.Navigation = class Navigation {
    static init() {
        this.screens = {};
        this.currentScreen = null;
        this.history = [];
    }

    static register(name, element) {
        this.screens[name] = element;
    }

    static show(name, props = {}, options = { addToHistory: true }) {
        console.log(`Navigation: Switching to '${name}'`, options);

        if (this.currentScreen === name) return; // Already here

        // Push current to history if valid and requested
        if (this.currentScreen && options.addToHistory) {
            this.history.push(this.currentScreen);
        }

        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        const target = this.screens[name];
        if (target) {
            target.style.display = 'flex';
            target.style.pointerEvents = 'auto';
            void target.offsetWidth; // Force Reflow
            target.classList.add('active');

            this.currentScreen = name;

            if (target.onShow) {
                try {
                    target.onShow(props);
                } catch (e) {
                    console.error("Error in onShow:", e);
                }
            }
        } else {
            console.error(`Navigation: Screen '${name}' not found`);
        }
    }

    static back() {
        if (this.history.length > 0) {
            const prev = this.history.pop();
            console.log(`Navigation: Back to '${prev}'`);
            this.show(prev, {}, { addToHistory: false });
        } else {
            console.log("Navigation: No history, defaulting to home");
            this.show('home', {}, { addToHistory: false });
        }
    }
};
