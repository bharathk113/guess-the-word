window.Modal = class Modal {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-content">
                <h2 id="modal-title">Title</h2>
                <div id="modal-body" style="margin:20px 0; font-size:1.1rem; line-height:1.5;">Body</div>
                <div class="modal-actions" style="display:flex; flex-direction:column; gap:10px; width:100%; align-items:center;">
                    <div id="modal-custom-buttons" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; width:100%;"></div>
                    <button class="btn-primary" id="btn-modal-action">Action</button>
                    <button class="btn-outline" id="btn-modal-close" style="font-size:0.9rem; opacity:0.9; margin-top:5px; border-color:rgba(255,255,255,0.2);">Close</button>
                </div>
            </div>
        `;
        this.element.style.display = 'none'; // Force hide initially
        document.body.appendChild(this.element);

        this.titleEl = this.element.querySelector('#modal-title');
        this.bodyEl = this.element.querySelector('#modal-body');
        this.actionBtn = this.element.querySelector('#btn-modal-action');
        this.closeBtn = this.element.querySelector('#btn-modal-close');

        this.customBtnsContainer = this.element.querySelector('#modal-custom-buttons');
        this.closeBtn.onclick = () => this.hide();
    }

    show(title, body, actionText, onAction, onClose, customButtons = []) {
        this.titleEl.textContent = title;
        this.bodyEl.innerHTML = body; // Allow HTML

        // reset custom
        this.customBtnsContainer.innerHTML = '';

        if (customButtons && customButtons.length > 0) {
            this.actionBtn.style.display = 'none'; // Hide default if custom exist
            customButtons.forEach(btn => {
                const b = document.createElement('button');
                b.className = btn.class || 'btn-outline';
                b.textContent = btn.text;
                b.onclick = () => {
                    if (!btn.stayOpen) this.hide();
                    if (btn.onClick) btn.onClick();
                };
                this.customBtnsContainer.appendChild(b);
            });
        } else if (actionText) {
            this.actionBtn.textContent = actionText;
            this.actionBtn.style.display = 'block';
            this.actionBtn.onclick = () => {
                this.hide();
                if (onAction) onAction();
            };
        } else {
            this.actionBtn.style.display = 'none';
        }

        this.closeBtn.onclick = () => {
            this.hide();
            if (onClose) onClose();
        };

        this.element.classList.add('active');
        this.element.style.display = 'flex'; // Show
    }

    hide() {
        this.element.classList.remove('active');
        this.element.style.display = 'none'; // Hide
    }
};
