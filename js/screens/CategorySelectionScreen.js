window.CategoryScreen = class CategoryScreen {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'screen category-screen';
        this.element.id = 'category-screen';
        this.render();
    }

    render() {
        this.element.innerHTML = `
            <button class="btn-back-float" style="top:20px; left:20px;" onclick="window.Navigation.show('home')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
            <h2>Select Category</h2>
            <div class="category-list">
                <button class="btn-secondary" onclick="window.Navigation.show('length-select', { category: 'general' })">
                    📚 General
                </button>
            </div>
        `;
        // No attachEvents needed for inline
    }

    attachEvents() {
        // Deprecated in favor of inline for robustness
    }

    getElement() {
        return this.element;
    }
};
