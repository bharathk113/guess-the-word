window.Navigation = class Navigation {
    static init() {
        this.screens = {};
        this.currentScreen = null;
    }

    static register(name, element) {
        this.screens[name] = element;
    }

    static show(name, props = {}) {
        console.log(`Navigation: Switching to '${name}'`);

        // Hide all screens first to prevent overlays
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        const target = this.screens[name];
        if (target) {
            console.log(`Navigation: Found target for '${name}'`, target);

            target.style.display = 'flex';
            target.style.pointerEvents = 'auto'; // FORCE INTERACTION

            // Force reflow
            void target.offsetWidth;

            // Synchronous activation - no timeout
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
};
