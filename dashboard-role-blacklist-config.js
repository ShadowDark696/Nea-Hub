(function () {
    function q(s) { return document.querySelector(s); }
    function qa(s) { return document.querySelectorAll(s); }

    function blApi(path, opts) {
        const BASE = window.BASE_API || 'https://rupc-qzce.onrender.com';
        const token = localStorage.getItem('nea_sid') || localStorage.getItem('nea_token');
        const headers = Object.assign({}, (opts && opts.headers) || {});
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return fetch(BASE + path, Object.assign({}, opts, { headers: headers, credentials: 'include' }))
            .then(function (r) { return r.json(); })
            .catch(function () { return null; });
    }

    function blToast(msg, isErr) {
        const t = document.getElementById('toast');
        const m = document.getElementById('toastMsg');
        const ic = document.getElementById('toast-icon');
        if (!t || !m) { return; }
        m.textContent = msg;
        if (ic) ic.className = isErr
            ? 'fa-solid fa-circle-exclamation text-red-400 text-xl'
            : 'fa-solid fa-circle-check text-green-400 text-xl';
        t.classList.add('toast-enter');
        t.style.display = 'flex';
        clearTimeout(t._blTo);
        t._blTo = setTimeout(function () {
            t.classList.remove('toast-enter');
            t.style.display = 'none';
        }, 3000);
    }

    window._loadBlacklistConfig = async function () {
        const guildId = window.currentGuildId;
        if (!guildId) {
            q('#blacklist_config_status').textContent = 'Sin servidor';
            return;
        }

        const res = await blApi('/api/bot/role-blacklist-config/' + guildId);
        if (!res || !res.success) {
            q('#blacklist_config_status').textContent = 'Error cargando configuración';
            return;
        }

        const toggle = q('#blacklist_visibility_toggle');
        const status = q('#blacklist_config_status');

        if (toggle) toggle.checked = res.showReason;
        if (status) {
            status.innerHTML = res.showReason
                ? '<span class="text-green-400">🟢 VISIBLE</span> — Se mostrará "Blacklist" en auditoría'
                : '<span class="text-gray-400">🔴 OCULTA</span> — Sin razón específica en auditoría';
        }
    };

    window._toggleBlacklistVisibility = async function () {
        const guildId = window.currentGuildId;
        if (!guildId) {
            blToast('SELECCIONA UN SERVIDOR', true);
            return;
        }

        const toggle = q('#blacklist_visibility_toggle');
        const newValue = toggle.checked;

        const res = await blApi('/api/bot/role-blacklist-config/' + guildId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ showReason: newValue })
        });

        if (res && res.success) {
            blToast(newValue ? '✅ Razón de blacklist visible en auditoría' : '✅ Razón de blacklist oculta', false);
            window._loadBlacklistConfig();
        } else {
            blToast('❌ Error actualizando configuración', true);
            toggle.checked = !newValue;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            const toggle = q('#blacklist_visibility_toggle');
            if (toggle) {
                toggle.addEventListener('change', window._toggleBlacklistVisibility);
                window._loadBlacklistConfig();
            }
        });
    } else {
        const toggle = q('#blacklist_visibility_toggle');
        if (toggle) {
            toggle.addEventListener('change', window._toggleBlacklistVisibility);
            window._loadBlacklistConfig();
        }
    }

    window._onBlacklistGuildChange = function () {
        window._loadBlacklistConfig();
    };
})();
