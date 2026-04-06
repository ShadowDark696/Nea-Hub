/**
 * CRITICAL FIX: Auto-load channels/members when panels open
 * Hacerload de datos cuando el usuario abre una categoría
 */

(function() {
    console.log('[*] Dashboard Auto-Loader iniciando...');
    
    // Esperar a que el DOM y BASE_API estén listos
    function waitForBaseAPI() {
        return new Promise(resolve => {
            let tries = 0;
            const interval = setInterval(() => {
                if (typeof BASE_API !== 'undefined' && BASE_API) {
                    clearInterval(interval);
                    resolve();
                } else if (tries++ > 20) {
                    clearInterval(interval);
                    console.warn('[!] BASE_API no cargó, usando default');
                    window.BASE_API = 'https://rupc-qzce.onrender.com';
                    resolve();
                }
            }, 100);
        });
    }

    waitForBaseAPI().then(() => {
        console.log('[✓] BASE_API definido:', BASE_API);
        setupAutoLoaders();
    });

    async function fetchChannels(guildId) {
        try {
            const token = localStorage.getItem('nea_sid');
            if (!token) {
                console.warn('[!] No token found');
                return [];
            }

            const response = await fetch(`${BASE_API}/api/bot/channels/${guildId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                console.error(`[✗] API error ${response.status}`);
                return [];
            }

            const data = await response.json();
            return data.channels || [];
        } catch (err) {
            console.error('[✗] Fetch error:', err);
            return [];
        }
    }

    async function populateChannelSelect(selectId, listId, guildId) {
        const list = document.getElementById(listId);
        if (!list) {
            console.warn(`[!] Element ${listId} not found`);
            return;
        }

        list.innerHTML = '<div class="text-xs text-gray-400 p-4 text-center">Cargando...</div>';

        const channels = await fetchChannels(guildId);

        if (channels.length === 0) {
            list.innerHTML = '<div class="text-xs text-red-400 p-4 text-center">Sin canales</div>';
            return;
        }

        const selectInput = document.getElementById(selectId);
        list.innerHTML = channels
            .map(ch => `
                <div class="p-2 text-xs cursor-pointer hover:bg-purple-900/20 text-purple-200"
                     onclick="document.getElementById('${selectId}').value='${ch.id}'; document.getElementById('${selectId}').dataset.name='${ch.name}';">
                    #${ch.name}
                </div>
            `)
            .join('');

        console.log(`[✓] Populated ${listId} with ${channels.length} channels`);
    }

    function setupAutoLoaders() {
        // Mapeo de botones a listas de canales
        const loaders = [
            { btn: '[data-target="mod-clear"]', list: 'clear_channel_list', select: 'clear_channel_select' },
            { btn: '[data-target="mod-mute"]', list: 'mute_channel_list', select: 'mute_channel_select' },
            { btn: '[data-target="mod-snipe"]', list: 'snipe_channel_list', select: 'snipe_channel_select' },
            { btn: '[data-target="mod-roleadd"]', list: 'role_channel_select', select: 'role_channel_select' }
        ];

        loaders.forEach(loader => {
            const btn = document.querySelector(loader.btn);
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    setTimeout(async () => {
                        if (typeof currentGuildId !== 'undefined' && currentGuildId) {
                            console.log(`[*] Loading channels for guild: ${currentGuildId}`);
                            await populateChannelSelect(loader.select, loader.list, currentGuildId);
                        } else {
                            console.warn('[!] currentGuildId no definido');
                        }
                    }, 100);
                });
            }
        });

        console.log('[✓] Auto-loaders configurados');
    }
})();
