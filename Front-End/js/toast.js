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
}

// Create global toast instance
const toast = new Toast();

// Global helper function (mimics alert API for easy replacement)
function showToast(message, type = 'info', duration = 3000) {
    return toast.show(message, type, duration);
}
