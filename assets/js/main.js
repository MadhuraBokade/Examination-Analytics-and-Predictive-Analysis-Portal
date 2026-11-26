/**
 * Zeal EPAP - Common JavaScript Utilities
 * Department of Information Technology, Zeal College of Engineering & Research
 */

document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const appSidebar = document.getElementById('appSidebar');

    if (sidebarToggleBtn && appSidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            appSidebar.classList.toggle('show');
        });
    }

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

    updateCountdowns();
    setInterval(updateCountdowns, 60000);

    const activityFilter = document.getElementById('activityFilterSelect');
    if (activityFilter) {
        activityFilter.addEventListener('change', (e) => {
            const filter = e.target.value;
            const items = document.querySelectorAll('.activity-card-item');
            items.forEach(item => {
                item.style.display = (filter === 'all' || item.dataset.status === filter) ? 'block' : 'none';
            });
        });
    }
});

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateCountdowns() {
    const badges = document.querySelectorAll('.countdown-timer');
    badges.forEach(badge => {
        const deadlineStr = badge.getAttribute('data-deadline');
        if (!deadlineStr) return;

        const deadline = new Date(deadlineStr).getTime();
        const now = Date.now();
        const distance = deadline - now;

        if (distance < 0) {
            badge.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Overdue';
            badge.className = 'deadline-badge deadline-urgent countdown-timer';
        } else {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 2) {
                badge.innerHTML = `<i class="bi bi-clock me-1"></i> ${days}d ${hours}h left`;
                badge.className = 'deadline-badge deadline-safe countdown-timer';
            } else if (days >= 1) {
                badge.innerHTML = `<i class="bi bi-clock-history me-1"></i> ${days}d ${hours}h left`;
                badge.className = 'deadline-badge deadline-warning countdown-timer';
            } else {
                badge.innerHTML = `<i class="bi bi-alarm-fill me-1"></i> ${hours}h left today!`;
                badge.className = 'deadline-badge deadline-urgent countdown-timer';
            }
        }
    });
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('globalToastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'globalToastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '2000';
        document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';
    toastEl.className = `toast align-items-center text-white ${bgClass} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(message)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href="login.html"]');
    if (link && link.textContent.toLowerCase().includes('sign out')) {
        e.preventDefault();
        try {
            if (window.EPAP_API) {
                await window.EPAP_API.epapFetch('/api/auth/logout', { method: 'POST' });
            } else {
                await fetch('/api/auth/logout', { method: 'POST' });
            }
        } catch (_) {}
        window.location.href = '/login.html';
    }
});
