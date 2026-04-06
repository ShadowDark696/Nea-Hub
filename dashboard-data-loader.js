/**
 * Dashboard Data Loader - Carga automáticamente datos cuando se cambia de categoría
 * Maneja: Canales, Miembros, Roles
 */

const DataLoader = (() => {
    const cache = {
        channels: {},
        members: {},
        roles: {}
    };

    const loadChannels = async (guildId) => {
        if (cache.channels[guildId]) {
            return cache.channels[guildId];
        }

        try {
            const token = localStorage.getItem('nea_sid');
            const response = await fetch(`${BASE_API}/api/bot/channels/${guildId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error(`[✗] Error loading channels: ${response.status}`);
                return [];
            }

            const data = await response.json();
            const channels = data.channels || [];
            cache.channels[guildId] = channels;
            console.log(`[✓] Loaded ${channels.length} channels for guild ${guildId}`);
            return channels;
        } catch (err) {
            console.error('[✗] Error fetching channels:', err);
            return [];
        }
    };

    const loadMembers = async (guildId) => {
        if (cache.members[guildId]) {
            return cache.members[guildId];
        }

        try {
            const token = localStorage.getItem('nea_sid');
            const response = await fetch(`${BASE_API}/api/bot/members/${guildId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error(`[✗] Error loading members: ${response.status}`);
                return [];
            }

            const data = await response.json();
            const members = data.members || [];
            cache.members[guildId] = members;
            console.log(`[✓] Loaded ${members.length} members for guild ${guildId}`);
            return members;
        } catch (err) {
            console.error('[✗] Error fetching members:', err);
            return [];
        }
    };

    const populateChannelList = async (containerId, guildId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="text-xs text-purple-300/50 p-4 text-center">Cargando canales...</div>';

        const channels = await loadChannels(guildId);
        
        if (channels.length === 0) {
            container.innerHTML = '<div class="text-xs text-red-300/50 p-4 text-center">Sin canales disponibles</div>';
            return;
        }

        container.innerHTML = channels
            .filter(ch => ch.type === 0 || ch.type === 2) // Text y Voice channels
            .map(ch => `<div class="premium-list-item cursor-pointer p-2 hover:bg-purple-900/20 rounded text-purple-200 text-xs" onclick="selectChannel('${ch.id}', '${ch.name.replace(/'/g, "\\'")}', '${containerId}')">#${ch.name}</div>`)
            .join('');
    };

    const populateMemberList = async (containerId, guildId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="text-xs text-purple-300/50 p-4 text-center">Cargando miembros...</div>';

        const members = await loadMembers(guildId);

        if (members.length === 0) {
            container.innerHTML = '<div class="text-xs text-red-300/50 p-4 text-center">Sin miembros disponibles</div>';
            return;
        }

        container.innerHTML = members
            .slice(0, 50) // Limitar a los primeros 50
            .map(m => `<div class="premium-list-item cursor-pointer p-2 hover:bg-purple-900/20 rounded text-purple-200 text-xs" onclick="selectMember('${m.id}', '${m.username.replace(/'/g, "\\'")}', '${containerId}')">👤 ${m.username}#${m.discriminator || '0000'}</div>`)
            .join('');
    };

    const selectChannel = (channelId, channelName, sourceId) => {
        const input = document.getElementById(sourceId.replace('_list', '_select'));
        if (input) {
            input.value = channelId;
            input.dataset.name = channelName;
            toast(`Canal seleccionado: #${channelName}`);
        }
    };

    const selectMember = (memberId, memberName, sourceId) => {
        const input = document.getElementById(sourceId.replace('_list', '_select'));
        if (input) {
            input.value = memberId;
            input.dataset.name = memberName;
            toast(`Miembro seleccionado: ${memberName}`);
        }
    };

    const setupCategoryLoaders = () => {
        const categories = [
            { button: 'mod-clear', lists: ['clear_channel_list'] },
            { button: 'mod-mute', lists: ['mute_channel_list'] },
            { button: 'mod-unmute', lists: ['unmute_channel_list'] },
            { button: 'mod-snipe', lists: ['snipe_channel_list'] },
            { button: 'mod-snipe-advanced', lists: ['snipe_adv_channel_list'] },
            { button: 'mod-roleadd', lists: ['role_user_select'] }
        ];

        categories.forEach(cat => {
            const btn = document.querySelector(`[data-target="${cat.button}"]`);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (currentGuildId) {
                        cat.lists.forEach(list => {
                            if (list.includes('channel')) {
                                populateChannelList(list, currentGuildId);
                            } else if (list.includes('member') || list.includes('user')) {
                                populateMemberList(list, currentGuildId);
                            }
                        });
                    }
                });
            }
        });
    };

    // Exponer funciones globales
    window.selectChannel = selectChannel;
    window.selectMember = selectMember;
    window.populateChannelList = populateChannelList;
    window.populateMemberList = populateMemberList;

    return {
        init: setupCategoryLoaders,
        loadChannels,
        loadMembers,
        populateChannelList,
        populateMemberList,
        cache
    };
})();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DataLoader.init());
} else {
    DataLoader.init();
}

console.log('[✓] DataLoader initialized');
