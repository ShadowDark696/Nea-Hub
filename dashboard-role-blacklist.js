// ===================== ROLE BLACKLIST PANEL (Self-contained) =====================
(function () {
    function q(s) { return document.querySelector(s); }

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

    function getData() {
        return {
            members: window.cachedMembers || [],
            roles: window.cachedRoles || [],
            guildId: window.currentGuildId || null
        };
    }

    let blacklistSelectedRoles = [];

    // ─── Member list ──────────────────────────────────────────────────────────
    function renderMemberList(filter) {
        filter = (filter || '').toLowerCase();
        const container = q('#blacklist_user_list');
        const hiddenInput = q('#blacklist_user_select');
        if (!container) return;
        const members = getData().members;
        const filtered = members.filter(function (m) {
            const name = (m.nick || (m.user && (m.user.global_name || m.user.username)) || '').toLowerCase();
            const id = (m.user && m.user.id) || '';
            return name.includes(filter) || id.includes(filter);
        }).slice(0, 50);
        if (filtered.length === 0) {
            container.innerHTML = '<div class="text-xs text-red-400/50 p-6 text-center">No se encontraron usuarios.</div>';
            return;
        }
        container.innerHTML = filtered.map(function (m) {
            const avatar = m.user && m.user.avatar
                ? 'https://cdn.discordapp.com/avatars/' + m.user.id + '/' + m.user.avatar + '.png?size=64'
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
            const name = m.nick || (m.user && (m.user.global_name || m.user.username)) || '?';
            const id = m.user && m.user.id;
            const selected = hiddenInput && hiddenInput.value === id;
            return '<div class="member-card flex items-center gap-3 p-3 rounded-lg cursor-pointer' + (selected ? ' selected' : '') + '" onclick="window._blSelUser(\'' + id + '\', this)">' +
                '<img src="' + avatar + '" class="w-10 h-10 rounded-full border border-purple-500/30" onerror="this.src=\'https://cdn.discordapp.com/embed/avatars/0.png\'">' +
                '<div class="overflow-hidden">' +
                '<div class="text-sm font-bold text-purple-200 truncate">' + name + '</div>' +
                '<div class="text-[10px] text-purple-400/50 truncate">' + id + '</div>' +
                '</div></div>';
        }).join('');
    }

    window._blSelUser = function (id, el) {
        const hidden = q('#blacklist_user_select');
        if (hidden) hidden.value = id;
        document.querySelectorAll('#blacklist_user_list .member-card').forEach(function (c) { c.classList.remove('selected'); });
        if (el) el.classList.add('selected');
    };

    // ─── Role list ────────────────────────────────────────────────────────────
    function renderRoleList(filter) {
        filter = (filter || '').toLowerCase();
        const container = q('#blacklist_role_list');
        if (!container) return;
        const roles = getData().roles;
        const filtered = roles.filter(function (r) {
            if (r.name === '@everyone') return false;
            return r.name.toLowerCase().includes(filter) || r.id.includes(filter);
        });
        if (filtered.length === 0) {
            container.innerHTML = '<div class="text-xs text-red-400/50 p-6 text-center">No se encontraron roles.</div>';
            return;
        }
        container.innerHTML = filtered.map(function (r) {
            const color = r.color ? '#' + r.color.toString(16).padStart(6, '0') : '#99aab5';
            const isSel = blacklistSelectedRoles.find(function (sr) { return sr.id === r.id; });
            const safeName = r.name.replace(/'/g, "\\'");
            return '<div class="member-card flex items-center gap-3 p-3 rounded-lg cursor-pointer' + (isSel ? ' selected' : '') + '" onclick="window._blTogRole(\'' + r.id + '\',\'' + safeName + '\',\'' + color + '\')">' +
                '<div class="w-10 h-10 rounded-full flex items-center justify-center text-lg" style="background:' + color + ';box-shadow:0 0 10px ' + color + '55">' +
                '<i class="fa-solid fa-shield-halved text-white text-sm"></i></div>' +
                '<div class="overflow-hidden">' +
                '<div class="text-sm font-bold truncate" style="color:' + color + '">' + r.name + '</div>' +
                '<div class="text-[10px] opacity-50">Pos: ' + r.position + '</div>' +
                '</div></div>';
        }).join('');
    }

    window._blTogRole = function (id, name, color) {
        const idx = blacklistSelectedRoles.findIndex(function (r) { return r.id === id; });
        if (idx >= 0) blacklistSelectedRoles.splice(idx, 1);
        else blacklistSelectedRoles.push({ id: id, name: name, color: color });
        updateRoleTags();
        renderRoleList((q('#blacklist_role_search') || {}).value);
    };

    function updateRoleTags() {
        const container = q('#blacklist_roles_tags');
        if (!container) return;
        if (blacklistSelectedRoles.length === 0) {
            container.innerHTML = '<span class="text-xs text-red-300/50">Ninguno</span>';
            return;
        }
        container.innerHTML = blacklistSelectedRoles.map(function (r) {
            return '<span class="px-2 py-1 rounded text-xs font-bold text-white cursor-pointer" style="background:' + (r.color || '#99aab5') + '" onclick="window._blUntagRole(\'' + r.id + '\')" title="Click para remover">' + r.name + ' \u2715</span>';
        }).join('');
    }

    window._blUntagRole = function (id) {
        blacklistSelectedRoles = blacklistSelectedRoles.filter(function (r) { return r.id !== id; });
        updateRoleTags();
        renderRoleList((q('#blacklist_role_search') || {}).value);
    };

    // ─── Blacklist display ────────────────────────────────────────────────────
    async function loadBlacklistDisplay() {
        const guildId = getData().guildId;
        if (!guildId) return;
        const container = q('#blacklist_list_container');
        if (!container) return;
        container.innerHTML = '<div class="text-xs text-red-300/50 text-center p-4"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Cargando...</div>';
        const data = await blApi('/api/bot/role-blacklist/' + guildId);
        if (!data || !data.blacklist) {
            container.innerHTML = '<p class="text-xs text-red-300/50 text-center">Sin datos de blacklist</p>';
            return;
        }
        const { members, roles } = getData();
        let html = '';
        for (const uid in data.blacklist) {
            const info = data.blacklist[uid];
            const mb = members.find(function (x) { return x.user && x.user.id === uid; });
            const userName = mb ? (mb.nick || (mb.user && mb.user.username) || uid) : uid;
            const roleNames = (info.roles || []).map(function (rid) {
                const role = roles.find(function (r) { return r.id === rid; });
                return role ? role.name : rid;
            }).join(', ');
            html += '<div class="bg-black/50 border border-red-500/20 p-3 rounded flex justify-between items-center mb-2">' +
                '<div>' +
                '<div class="text-xs font-bold text-red-300">' + userName + '</div>' +
                '<div class="text-[10px] text-red-300/60">' + (roleNames || 'Sin roles') + '</div>' +
                (info.reason ? '<div class="text-[9px] text-red-300/50 mt-1">Raz\u00f3n: ' + info.reason + '</div>' : '') +
                '</div>' +
                '<button onclick="window._blRemove(\'' + uid + '\')" class="text-red-400 hover:text-red-200 text-sm ml-3" title="Remover"><i class="fa-solid fa-trash"></i></button>' +
                '</div>';
        }
        container.innerHTML = html || '<p class="text-xs text-red-300/50 text-center">Blacklist vac\u00eda</p>';
    }

    window._blRemove = async function (userId) {
        const guildId = getData().guildId;
        if (!confirm('\u00bfRemover de blacklist?') || !guildId) return;
        const res = await blApi('/api/bot/role-blacklist/' + guildId + '/' + userId, { method: 'DELETE' });
        blToast(res && res.success ? '\u2705 Removido de blacklist' : 'Error removiendo', !(res && res.success));
        loadBlacklistDisplay();
    };

    // ─── Panel entry point ────────────────────────────────────────────────────
    window.loadBlacklistPanel = function () {
        const guildId = getData().guildId;
        if (!guildId) return;
        renderMemberList();
        renderRoleList();
        updateRoleTags();
        loadBlacklistDisplay();
    };

    // ─── panelChange trigger ──────────────────────────────────────────────────
    document.addEventListener('panelChange', function (e) {
        if (e.detail && e.detail.id === 'mod-roleblacklist') {
            setTimeout(window.loadBlacklistPanel, 120);
        }
    });

    // ─── Wire buttons & search ────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const uSearch = q('#blacklist_user_search');
        if (uSearch) uSearch.addEventListener('input', function (e) { renderMemberList(e.target.value); });

        const rSearch = q('#blacklist_role_search');
        if (rSearch) rSearch.addEventListener('input', function (e) { renderRoleList(e.target.value); });

        const addBtn = q('#btn_do_blacklist');
        if (addBtn) addBtn.addEventListener('click', async function (e) {
            const userId = (q('#blacklist_user_select') || {}).value;
            const reason = (q('#blacklist_reason') || {}).value || '';
            const guildId = getData().guildId;
            if (!userId) return blToast('SELECCIONA UN USUARIO', true);
            if (blacklistSelectedRoles.length === 0) return blToast('SELECCIONA AL MENOS UN ROL', true);
            if (!guildId) return blToast('SIN SERVIDOR SELECCIONADO', true);
            const orig = e.target.innerHTML;
            e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>AGREGANDO...';
            const res = await blApi('/api/bot/role-blacklist/' + guildId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    roleIds: blacklistSelectedRoles.map(function (r) { return r.id; }),
                    reason: reason
                })
            });
            blToast(res && res.success ? '\u2705 Agregado a blacklist' : (res && res.error) || 'Error agregando', !(res && res.success));
            const reasonEl = q('#blacklist_reason'); if (reasonEl) reasonEl.value = '';
            const userEl = q('#blacklist_user_select'); if (userEl) userEl.value = '';
            blacklistSelectedRoles = [];
            updateRoleTags();
            loadBlacklistDisplay();
            e.target.innerHTML = orig;
        });

        const removeBtn = q('#btn_do_blacklist_remove');
        if (removeBtn) removeBtn.addEventListener('click', async function () {
            const userId = (q('#blacklist_user_select') || {}).value;
            const guildId = getData().guildId;
            if (!userId) return blToast('SELECCIONA UN USUARIO', true);
            if (!guildId) return blToast('SIN SERVIDOR SELECCIONADO', true);
            if (!confirm('\u00bfRemover de blacklist?')) return;
            const res = await blApi('/api/bot/role-blacklist/' + guildId + '/' + userId, { method: 'DELETE' });
            blToast(res && res.success ? '\u2705 Removido de blacklist' : 'Error removiendo', !(res && res.success));
            loadBlacklistDisplay();
        });
    });
})();