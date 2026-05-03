/**
 * Project details bottom sheet.
 * Keeps timeline cards compact while exposing full project information on demand.
 */
class ProjectDetailsModal {
    constructor() {
        this.modal = null;
        this.titleEl = null;
        this.bodyEl = null;
        this.closeBtn = null;
        this.lastFocusedElement = null;

        this.init();
    }

    init() {
        this.createModal();
        this.ensureDetailButtons();
        this.bindCardButtons();
        this.bindModalEvents();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'project-detail-modal';
        this.modal.setAttribute('aria-hidden', 'true');
        this.modal.innerHTML = `
            <div class="project-detail-overlay" data-project-detail-close></div>
            <section class="project-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="project-detail-title">
                <button type="button" class="project-detail-close" aria-label="Fechar detalhes" data-project-detail-close>
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <div class="project-detail-content">
                    <h2 id="project-detail-title"></h2>
                    <div class="project-detail-body"></div>
                </div>
            </section>`;

        document.body.appendChild(this.modal);
        this.titleEl = this.modal.querySelector('#project-detail-title');
        this.bodyEl = this.modal.querySelector('.project-detail-body');
        this.closeBtn = this.modal.querySelector('.project-detail-close');
    }

    ensureDetailButtons() {
        document.querySelectorAll('#projects .timeline-card').forEach((card) => {
            const actions = card.querySelector('.timeline-card-actions');

            if (!actions || actions.querySelector('.timeline-card-details')) {
                return;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'timeline-card-btn timeline-card-details';
            button.setAttribute('aria-haspopup', 'dialog');
            button.innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i> Ver detalhes';
            actions.appendChild(button);
        });
    }

    bindCardButtons() {
        document.querySelectorAll('#projects .timeline-card-details').forEach((button) => {
            button.addEventListener('click', () => this.openFromButton(button));
        });
    }

    bindModalEvents() {
        this.modal.querySelectorAll('[data-project-detail-close]').forEach((element) => {
            element.addEventListener('click', () => this.close());
        });

        document.addEventListener('keydown', (event) => {
            if (!this.isOpen()) {
                return;
            }

            if (event.key === 'Escape') {
                this.close();
            }

            if (event.key === 'Tab') {
                this.keepFocusInside(event);
            }
        });
    }

    openFromButton(button) {
        const card = button.closest('.timeline-card');

        if (!card) {
            return;
        }

        this.lastFocusedElement = button;
        this.populate(card);
        this.modal.classList.add('is-open');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('project-detail-open');
        window.setTimeout(() => this.closeBtn.focus(), 0);
    }

    populate(card) {
        const title = card.querySelector('.timeline-card-title')?.textContent?.trim() || 'Projeto';
        const meta = card.querySelector('.timeline-card-meta')?.cloneNode(true);
        const image = card.querySelector('.timeline-card-image')?.cloneNode(true);
        const description = card.querySelector('.timeline-card-description')?.cloneNode(true);
        const accessNote = card.querySelector('.timeline-card-access-note')?.cloneNode(true);
        const updateNote = card.querySelector('.timeline-card-update-note')?.cloneNode(true);
        const actions = card.querySelector('.timeline-card-actions')?.cloneNode(true);

        this.titleEl.textContent = title;
        this.bodyEl.replaceChildren();

        if (meta) {
            this.bodyEl.appendChild(meta);
        }

        if (image) {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'project-detail-image-wrapper';
            imageWrapper.appendChild(image);
            this.bodyEl.appendChild(imageWrapper);
        }

        if (description) {
            this.bodyEl.appendChild(description);
        }

        if (accessNote) {
            this.bodyEl.appendChild(accessNote);
        }

        if (updateNote) {
            this.bodyEl.appendChild(updateNote);
        }

        if (actions) {
            actions.querySelectorAll('.timeline-card-details').forEach((detailsButton) => detailsButton.remove());
            actions.classList.add('project-detail-actions');

            if (actions.children.length) {
                this.bodyEl.appendChild(actions);
            }
        }
    }

    close() {
        this.modal.classList.remove('is-open');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('project-detail-open');

        if (this.lastFocusedElement instanceof HTMLElement) {
            this.lastFocusedElement.focus();
        }
    }

    isOpen() {
        return this.modal.classList.contains('is-open');
    }

    keepFocusInside(event) {
        const focusable = Array.from(
            this.modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter((element) => element.offsetParent !== null);

        if (!focusable.length) {
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.projectDetailsModal = new ProjectDetailsModal();
});
