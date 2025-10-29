/**
 * Toast Notification System
 * Simple, non-intrusive alternative to alert()
 */

class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (default: 3000)
     * @param {string} title - Optional title for the toast
     */
    show(message, type = 'info', duration = 3000, title = null) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Get icon based on type
        const icon = this.getIcon(type);

        // Get default title if not provided
        if (!title) {
            title = this.getDefaultTitle(type);
        }

        // Build toast HTML
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="닫기">&times;</button>
            ${duration > 0 ? `<div class="toast-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
        `;

        // Add to container
        this.container.appendChild(toast);

        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hide(toast);
        });

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toast;
    }

    hide(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    getDefaultTitle(type) {
        const titles = {
            success: '성공',
            error: '오류',
            warning: '경고',
            info: '알림'
        };
        return titles[type] || titles.info;
    }

    // Convenience methods
    success(message, duration = 3000, title = null) {
        return this.show(message, 'success', duration, title);
    }

    error(message, duration = 4000, title = null) {
        return this.show(message, 'error', duration, title);
    }

    warning(message, duration = 3500, title = null) {
        return this.show(message, 'warning', duration, title);
    }

    info(message, duration = 3000, title = null) {
        return this.show(message, 'info', duration, title);
    }

    /**
     * Show a confirmation modal with confirm/cancel buttons
     * @param {string} message - The message to display
     * @param {string} confirmText - Text for confirm button (default: '확인')
     * @param {string} cancelText - Text for cancel button (default: '취소')
     * @param {string} title - Optional title for the modal
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    confirm(message, confirmText = '확인', cancelText = '취소', title = '확인') {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';

            modal.innerHTML = `
                <div class="confirm-modal-header">
                    <h3 class="confirm-modal-title">${title}</h3>
                </div>
                <div class="confirm-modal-body">
                    <p class="confirm-modal-message">${message}</p>
                </div>
                <div class="confirm-modal-footer">
                    <button class="confirm-modal-button cancel">${cancelText}</button>
                    <button class="confirm-modal-button confirm">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Show modal with animation
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);

            // Handle button clicks
            const confirmBtn = modal.querySelector('.confirm-modal-button.confirm');
            const cancelBtn = modal.querySelector('.confirm-modal-button.cancel');

            const closeModal = (result) => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
                resolve(result);
            };

            confirmBtn.addEventListener('click', () => closeModal(true));
            cancelBtn.addEventListener('click', () => closeModal(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal(false);
                }
            });
        });
    }
}

// Create global toast instance
const toast = new Toast();

// Global helper function (mimics alert API for easy replacement)
function showToast(message, type = 'info', duration = 3000) {
    return toast.show(message, type, duration);
}

// Global helper function for confirmation modal
function showConfirm(message, confirmText = '확인', cancelText = '취소', title = '확인') {
    return toast.confirm(message, confirmText, cancelText, title);
}
