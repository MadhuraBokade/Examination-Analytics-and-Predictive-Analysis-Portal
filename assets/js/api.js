/**
 * Zeal EPAP - Shared API Client, CSRF Manager, Auth Guard & XSS Escaping
 */
(function (global) {
    const BASE_PATH = typeof global.EPAP_BASE_PATH === 'string' ? global.EPAP_BASE_PATH : '';
    let csrfTokenCache = null;

    function apiUrl(path) {
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return BASE_PATH + path;
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function ensureCsrfToken() {
        if (csrfTokenCache) return csrfTokenCache;
        const res = await fetch(apiUrl('/api/auth/csrf'), { credentials: 'same-origin' });
        if (res.ok) {
            const data = await res.json();
            csrfTokenCache = data.csrf_token || '';
        }
        return csrfTokenCache || '';
    }

    async function epapFetch(path, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const headers = new Headers(options.headers || {});

        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            const token = await ensureCsrfToken();
            if (token) {
                headers.set('X-CSRF-Token', token);
            }
            if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }
        }

        const res = await fetch(apiUrl(path), {
            ...options,
            method,
            headers,
            credentials: 'same-origin',
        });

        if (res.status === 401 && !path.startsWith('/api/auth/')) {
            window.location.href = apiUrl('/login.html');
            throw new Error('Not authenticated');
        }
        return res;
    }

    async function epapRequireAuth(expectedRole) {
        const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'same-origin' });
        if (res.status === 401) {
            window.location.href = apiUrl('/login.html');
            return null;
        }
        const me = await res.json();
        if (me.csrf_token) {
            csrfTokenCache = me.csrf_token;
        }
        if (expectedRole && me.role !== expectedRole) {
            const target = me.role === 'student'
                ? '/student-dashboard.html'
                : me.role === 'faculty'
                    ? '/faculty-dashboard.html'
                    : '/admin-dashboard.html';
            window.location.href = apiUrl(target);
            return null;
        }
        if (me.must_change_password && !window.location.pathname.endsWith('profile.html')) {
            window.location.href = apiUrl('/profile.html?force=1');
            return null;
        }
        loadPublicSettings();
        return me;
    }

    function updateNavbarUser(me) {
        if (!me) return;
        const initials = (me.full_name || 'U')
            .split(/\s+/)
            .filter(Boolean)
            .map(w => w[0].toUpperCase())
            .join('')
            .slice(0, 2);
        const avatar = document.querySelector('header .rounded-circle');
        if (avatar) avatar.textContent = initials;
        const nameEl = document.querySelector('header .d-block.fw-bold.small.text-dark');
        if (nameEl) nameEl.textContent = me.full_name;
        const idEl = document.querySelector('header .d-block.text-muted.font-monospace');
        if (idEl) idEl.textContent = me.identifier;
    }

    async function loadPublicSettings() {
        try {
            const res = await fetch(apiUrl('/api/settings/public'), { credentials: 'same-origin' });
            if (!res.ok) return null;
            const s = await res.json();
            document.querySelectorAll('[data-setting]').forEach(el => {
                const key = el.getAttribute('data-setting');
                if (key && s[key] !== undefined && s[key] !== '') {
                    el.textContent = s[key];
                }
            });
            const supportWrap = document.getElementById('supportEmailWrap');
            if (supportWrap && s.support_email) {
                supportWrap.textContent = ' (' + s.support_email + ')';
            }
            return s;
        } catch (_) {
            return null;
        }
    }

    global.EPAP_API = {
        apiUrl,
        escapeHtml,
        ensureCsrfToken,
        epapFetch,
        epapRequireAuth,
        updateNavbarUser,
        loadPublicSettings,
        setCsrfToken: (t) => { csrfTokenCache = t; },
    };
    global.escapeHtml = escapeHtml;
})(window);
