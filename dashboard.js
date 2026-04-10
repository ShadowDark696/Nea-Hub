const $ = (s) => document.querySelector(s)

const BASE_API = window.location.origin.includes('github.io')
    ? 'https://rupc-qzce.onrender.com'
    : (window.location.origin || 'https://rupc-qzce.onrender.com')

let currentGuildId = null
let guildsData = []
let cachedMembers = []
let cachedChannels = []
let cachedRoles = []
let authenticated = false

async function verifySession() {
    const urlParams = new URLSearchParams(window.location.search)
    const sidFromUrl = urlParams.get('sid')

    if (sidFromUrl) {
        localStorage.setItem('nea_sid', sidFromUrl)
        localStorage.setItem('session_established_at', new Date().toISOString())
        sessionStorage.setItem('nea_sid', sidFromUrl)
        authenticated = true
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
        return true
    }

    const token = localStorage.getItem('nea_sid') || sessionStorage.getItem('nea_sid')
    if (!token) {
        redirectToLogin()
        return false
    }

    authenticated = true

    try {
        const res = await fetch(BASE_API + '/api/me', {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
            signal: AbortSignal.timeout(5000)
        })
        if (res.status === 401) {
            localStorage.removeItem('nea_sid')
            sessionStorage.removeItem('nea_sid')
            redirectToLogin()
            return false
        }
    } catch (e) {
        console.warn('Auth check failed:', e.message)
    }

    return true
}

function redirectToLogin() {
    if (window.location.search.includes('sid=')) {
        console.warn('Redirect check')
        localStorage.removeItem('nea_sid')
        window.setTimeout(() => {
            window.location.href = '/'
        }, 2000)
        return
    }
    localStorage.removeItem('nea_sid')
    window.location.href = BASE_API + '/auth/discord?redirect=' + encodeURIComponent(window.location.href)
}

document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await verifySession()
    if (!isAuth) return
    loadInitialData()
    loadInitialData()
})

async function api(path, req = {}) {
    const token = localStorage.getItem('nea_sid')
    if (token) {
        if (!req.headers) req.headers = {}
        req.headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const r = await fetch(BASE_API + path, { ...req, credentials: 'include' })
        if (r.status === 401) {
            localStorage.removeItem('nea_sid')
            window.location.href = BASE_API + '/auth/discord'
            return null
        }
        if (r.status === 500) {
            const err = await r.json()
            toast(`SYSTEM ERROR: ${err.error || 'Token not set'}`, true)
            return null
        }
        if (r.status === 404) {
            toast('ERROR 404: Ruta no encontrada.', true)
            return null
        }
        return r.json()
    } catch (e) {
        console.error('FETCH_FAILURE', e)
        toast('FALLA DE CONEXIÓN: Servidor Apagado o Red Débil', true)
        return null
    }
}

function toast(msg, isError = false) {
    const t = $('#toast')
    $('#toastMsg').textContent = msg
    $('#toast-icon').className = isError ? 'fa-solid fa-triangle-exclamation text-red-500 text-xl' : 'fa-solid fa-circle-check text-green-400 text-xl'
    t.classList.remove('hidden', 'border-green-500', 'border-red-500', 'shadow-[0_0_20px_rgba(0,255,157,0.3)]', 'shadow-[0_0_20px_rgba(255,0,60,0.3)]')
    t.classList.add(isError ? 'border-red-500' : 'border-green-500', isError ? 'shadow-[0_0_20px_rgba(255,0,60,0.3)]' : 'shadow-[0_0_20px_rgba(0,255,157,0.3)]')
    t.classList.add('toast-enter')
    t.classList.remove('hidden')
    setTimeout(() => { t.classList.add('hidden'); t.classList.remove('toast-enter') }, 4000)
}


function renderPremiumList(containerId, members, hiddenInputId, filter = '') {
    const container = document.querySelector(containerId)
    if (!container) return

    const filtered = members.filter(m => {
        const name = (m.nick || m.user.global_name || m.user.username).toLowerCase()
        const id = m.user.id.toLowerCase()
        const query = filter.toLowerCase()
        return name.includes(query) || id.includes(query)
    }).slice(0, 50)

    container.innerHTML = filtered.map(m => {
        const avatar = m.user.avatar
            ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=64`
            : 'https://cdn.discordapp.com/embed/avatars/0.png'
        const name = m.nick || m.user.global_name || m.user.username
        const isSelected = document.querySelector(hiddenInputId)?.value === m.user.id

        return `
      <div class="member-card flex items-center gap-3 p-3 rounded-lg ${isSelected ? 'selected' : ''}" onclick="selectPremiumMember('${hiddenInputId}', '${m.user.id}', this, '${containerId}')">
        <img src="${avatar}" class="member-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
        <div class="overflow-hidden">
          <div class="text-sm font-bold truncate">${name}</div>
          <div class="text-[10px] opacity-50 truncate">${m.user.username} • ${m.user.id}</div>
        </div>
      </div>
    `
    }).join('')

    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-xs text-purple-400/50 p-6 text-center">No se encontraron sujetos con ese patrón.</div>'
    }
}


function renderPremiumRoleList(containerId, roles, hiddenInputId, filter = '') {
    const container = document.querySelector(containerId)
    if (!container) return

    const filtered = roles.filter(r => {
        if (r.name === '@everyone') return false
        const name = r.name.toLowerCase()
        const query = filter.toLowerCase()
        return name.includes(query) || r.id.includes(query)
    })

    container.innerHTML = filtered.map(r => {
        const color = r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#99aab5'
        const isSelected = document.querySelector(hiddenInputId)?.value === r.id

        return `
      <div class="member-card flex items-center gap-3 p-3 rounded-lg ${isSelected ? 'selected' : ''}" onclick="selectPremiumMember('${hiddenInputId}', '${r.id}', this, '${containerId}')">
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style="background:${color}; box-shadow: 0 0 12px ${color}55;">
          <i class="fa-solid fa-shield-halved text-white text-sm"></i>
        </div>
        <div class="overflow-hidden">
          <div class="text-sm font-bold truncate" style="color:${color}">${r.name}</div>
          <div class="text-[10px] opacity-50 truncate">Pos: ${r.position} • ${r.id}</div>
        </div>
      </div>
    `
    }).join('')

    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-xs text-purple-400/50 p-6 text-center">No se encontraron roles.</div>'
    }
}

function selectPremiumMember(hiddenId, value, cardEl, containerId) {
    document.querySelector(hiddenId).value = value
    const cid = containerId.replace('#', '')
    document.querySelectorAll(`#${cid} .member-card`).forEach(c => c.classList.remove('selected'))
    cardEl.classList.add('selected')
    toast(`SELECCIONADO: ${value}`)
}

function setupSearch(inputId, containerId, data, hiddenId, renderFn) {
    const input = document.querySelector(inputId)
    if (!input) return
    input.oninput = (e) => {
        (renderFn || renderPremiumList)(containerId, data, hiddenId, e.target.value)
    }
}

const handleAction = async (endpoint, payload, okMsg) => {
    const btn = event.target || event.currentTarget
    const originalTxt = btn.innerHTML
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> XTRCT...'
    try {
        const res = await fetch(BASE_API + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('nea_sid')}`
            },
            body: JSON.stringify(payload)
        })
        if (res.ok) toast(okMsg)
        else {
            const d = await res.json()
            toast(`RECHAZADO: ${d.error || 'NIVEL DE HIERARQUIA'}`, true)
        }
    } catch (err) { toast('FALLO DE RED MATRIX', true) }
    finally { btn.innerHTML = originalTxt }
}


async function loadInitialData() {
    try {
        const user = await api('/api/user')
        if (!user || user.error) {
            localStorage.removeItem('nea_sid')
            return
        }
        $('#userBox').textContent = `SYSADMIN: ${user.username}`
        $('#userBox').classList.remove('hidden')
        $('#authBtn').innerHTML = '<i class="fa-solid fa-power-off mr-2"></i>DESCONECTAR'
        $('#authBtn').href = `${BASE_API}/auth/logout`
        $('#authBtn').onclick = () => { localStorage.clear(); }
        loadSelectorGrid()
    } catch (err) {
        $('#grid-container').innerHTML = `<div class="col-span-full h-48 flex items-center justify-center text-red-500">
        <i class="fa-solid fa-lock text-4xl"></i><span class="ml-4 hacker-font text-xl">REQUIERE CREDENCIALES ROOT</span>
    </div>`
    }
}


async function loadSelectorGrid() {
    $('#grid-container').innerHTML = `<div class="col-span-full h-48 flex items-center justify-center text-purple-500"><i class="fa-solid fa-spinner fa-spin text-4xl"></i><span class="ml-4 hacker-font text-xl">SINCRONIZANDO V10 DISCORD...</span></div>`
    const data = await api('/api/guilds')
    guildsData = data?.guilds || []
    renderGrid(guildsData)
}

function renderGrid(list) {
    const g = $('#grid-container')
    g.innerHTML = ''
    if (!list.length) {
        g.innerHTML = `<div class="col-span-full h-48 flex flex-col items-center justify-center text-purple-300/50"><i class="fa-solid fa-satellite-dish text-6xl mb-4"></i><span class="hacker-font text-lg">NO HAY REDES COMPATIBLES ALCANZABLES</span></div>`
        return
    }

    list.forEach(sv => {
        const div = document.createElement('div')
        div.className = 'glass-panel p-6 rounded-xl glitch-card cursor-pointer group flex items-center gap-4'
        div.innerHTML = `
      <div class="w-16 h-16 rounded-lg bg-black/80 flex items-center justify-center text-purple-400 font-bold overflow-hidden shadow-[0_0_10px_rgba(157,78,221,0.2)]">
        ${sv.icon
                ? `<img src="https://cdn.discordapp.com/icons/${sv.id}/${sv.icon}.png?size=128" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">`
                : sv.name.charAt(0)
            }
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-bold text-lg truncate group-hover:text-purple-400 transition">${sv.name}</h3>
        <p class="text-xs text-purple-400/50 hacker-font truncate">NODO: ${sv.id}</p>
        <span class="inline-block mt-2 px-2 py-0.5 bg-green-900/40 text-green-400 text-[10px] hacker-font rounded border border-green-500/30 group-hover:border-green-400 transition">OPERATIVO</span>
      </div>
    `
        div.onclick = () => enterDashboard(sv)
        g.appendChild(div)
    })
}

$('#search-grid').addEventListener('input', e => {
    const q = e.target.value.toLowerCase()
    renderGrid(guildsData.filter(g => g.name.toLowerCase().includes(q) || g.id.includes(q)))
})

$('#refresh-grid').addEventListener('click', loadSelectorGrid)



function enterDashboard(sv) {
    currentGuildId = sv.id

    $('#view-selector').classList.add('hidden')
    $('#view-dashboard').classList.remove('hidden')
    $('#dash-guild-name').textContent = sv.name
    $('#dash-guild-id').textContent = `ID: ${sv.id}`

    openWorkPanel('intro')

    loadHWStatus()
    fetchCoreSettings()
    fetchEscalationConfig()

    fetchRoles()
    fetchChannels()
    fetchMembers()
}

async function fetchRoles() {
    try {
        const data = await api(`/api/bot/roles/${currentGuildId}`)
        if (data && data.roles) {
            cachedRoles = data.roles.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position)

            
            const roleSelects = ['role_role_select', 'autorole_role_select']
            roleSelects.forEach(id => {
                const el = document.getElementById(id)
                if (!el) return
                el.innerHTML = '<option value="">-- SELECCIONAR ROL --</option>'
                cachedRoles.forEach(r => {
                    const color = r.color ? `#${r.color.toString(16).padStart(6, '0')}` : ''
                    el.innerHTML += `<option value="${r.id}" ${color ? `style="color:${color}"` : ''}>${r.name}</option>`
                })
            })

            
            if (document.querySelector('#roles_list_display')) {
                renderPremiumRoleList('#roles_list_display', cachedRoles, '#roles_view_select')
            }
        }
    } catch (e) {
        console.error('Error fetching roles', e)
    }
}

async function fetchChannels() {
    try {
        const data = await api(`/api/bot/channels/${currentGuildId}`)
        if (data && data.channels) {
            cachedChannels = data.channels

            
            const channelSelects = ['troll_channel_select', 'log_channel_select', 'broadcast_channel_select', 'sug_channel_select', 'lock_channel_select', 'embed_channel']
            channelSelects.forEach(id => {
                const el = document.getElementById(id)
                if (!el) return
                el.innerHTML = '<option value="">-- SELECCIONAR CANAL --</option>'
                data.channels.forEach(c => {
                    el.innerHTML += `<option value="${c.id}"># ${c.name}</option>`
                })
            })
        }
    } catch (e) {
        console.error('Error fetching channels', e)
    }
}

async function fetchMembers() {
    try {
        const data = await api(`/api/bot/members/${currentGuildId}`)
        if (data && data.members) {
            cachedMembers = data.members

            
            const memberPanels = [
                { list: '#role_user_list', input: '#role_user_select', search: '#role_user_search' },
                { list: '#ban_user_list', input: '#ban_user_select', search: '#ban_user_search' },
                { list: '#eco_user_list', input: '#eco_user_select', search: '#eco_user_search' },
                { list: '#mute_user_list', input: '#mute_user_select', search: '#mute_user_search' },
                { list: '#prison_user_list', input: '#prison_user_select', search: '#prison_user_search' },
                { list: '#kick_user_list', input: '#kick_user_select', search: '#kick_user_search' },
                { list: '#dm_user_list', input: '#dm_user_select', search: '#dm_user_search' },
                { list: '#nick_user_list', input: '#nick_user_select', search: '#nick_user_search' },
            ]

            memberPanels.forEach(p => {
                renderPremiumList(p.list, cachedMembers, p.input)
                setupSearch(p.search, p.list, cachedMembers, p.input)
            })
        }
    } catch (e) {
        console.error('Error fetching members', e)
    }
}


$('#btn-back').onclick = () => {
    currentGuildId = null
    $('#view-dashboard').classList.add('hidden')
    $('#view-selector').classList.remove('hidden')
    $('#hw-status').classList.add('hidden')
}


function loadHWStatus() {
    api('/api/bot/status').then(st => {
        if (st) {
            $('#hw-status').classList.remove('hidden')
            $('#st-ram').textContent = st.memoryUsage ? st.memoryUsage.rss : '??'
            $('#st-ping').textContent = Math.floor((Math.random() * 20) + 10) + 'ms'
        }
    }).catch(() => { })
}



document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'))
        const targetBtn = e.currentTarget
        targetBtn.classList.add('active')
        const viewId = targetBtn.getAttribute('data-target')
        openWorkPanel(viewId)
    })
})

function openWorkPanel(id) {
    document.querySelectorAll('.workspace-panel').forEach(p => p.classList.add('hidden'))
    const tg = document.getElementById(id === 'intro' ? 'mod-intro' : id)
    if (tg) tg.classList.remove('hidden')
}







async function fetchEscalationConfig() {
    if (!currentGuildId) return
    try {
        const data = await api(`/api/bot/warn-escalation/${currentGuildId}`)
        if (!data) return
        const mw = document.getElementById('esc_mute_warns')
        const md = document.getElementById('esc_mute_dur')
        const bw = document.getElementById('esc_ban_warns')
        if (mw) mw.value = data.muteWarns ?? 3
        if (md) md.value = data.muteDuration ?? 60
        if (bw) bw.value = data.banWarns ?? 5
    } catch (e) { }
}

async function fetchCoreSettings() {
    if (!currentGuildId) return
    const data = await api('/api/guilds/' + currentGuildId + '/settings')
    if (!data) return
    const s = data.settings || { prefix: '/', logChannel: '', modEnabled: true }
    $('#inp_prefix').value = s.prefix || '/'
    $('#inp_mod').checked = s.modEnabled !== false

    
    const logSelect = $('#log_channel_select')
    if (logSelect && s.logChannel) {
        setTimeout(() => { logSelect.value = s.logChannel }, 500)
    }

    
    const creadoresList = $('#creadoresList')
    creadoresList.innerHTML = ''
    if (data.creadores && data.creadores.length) {
        for (const uid of data.creadores) {
            const label = document.createElement('span')
            label.className = 'px-3 py-1 bg-black/60 border border-purple-500/40 rounded text-sm flex items-center gap-2 hover:border-purple-400 transition group'
            label.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-purple-400 text-xs"></i> <span class="creator-name">${uid}</span>
           <button onclick="removeCreador('${uid}')" class="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition ml-1" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>`
            creadoresList.appendChild(label)

            
            api(`/api/users/${uid}`).then(user => {
                if (user && user.username) {
                    const nameEl = label.querySelector('.creator-name')
                    const iconEl = label.querySelector('.fa-spinner')
                    if (nameEl) nameEl.textContent = `${user.username} (${uid.slice(-4)})`
                    if (iconEl) iconEl.className = 'fa-solid fa-user-astronaut text-purple-400'
                }
            }).catch(() => { })
        }
    } else {
        creadoresList.innerHTML = '<span class="text-xs text-white/40 hacker-font">SIN_CREADORES_ADICIONALES</span>'
    }
}


window.removeCreador = async (uid) => {
    if (!confirm(`¿Eliminar creador ${uid}?`)) return
    await api('/api/creadores/' + currentGuildId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid })
    })
    toast('CREADOR ELIMINADO')
    fetchCoreSettings()
}

$('#saveBtn').onclick = async (e) => {
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> XTRCT...'
    try {
        await api('/api/guilds/' + currentGuildId + '/settings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prefix: $('#inp_prefix').value,
                logChannel: $('#log_channel_select')?.value || '',
                modEnabled: $('#inp_mod').checked
            })
        })
        toast('SISTEMA RAIZ MODIFICADO')
    } catch (e) { toast('FALLO SISTEMICO', true) }
    e.target.innerHTML = 'GUARDAR CONFIGURACION'
}

$('#addCreador').onclick = async (e) => {
    const userId = $('#nuevoCreador').value
    if (!userId) return
    e.target.innerHTML = '...'
    try {
        await api('/api/guilds/' + currentGuildId + '/creadores', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        })
        toast('IDENTIDAD GESTIONADA')
        $('#nuevoCreador').value = ''
        fetchCoreSettings()
    } catch (er) { toast('ERROR DE PRIVILEGIO', true) }
    e.target.innerHTML = '<i class="fa-solid fa-plus mr-2"></i>INYECTAR'
}


$('#btn_do_role_add').onclick = () => {
    const userId = $('#role_user_select').value
    const roleId = $('#role_role_select').value
    if (!userId || !roleId) return toast('SELECCIONA USUARIO Y ROL', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/roles`, { action: 'add', userId, roleId }, 'PRIVILEGIO ADJUDICADO AL TARGET')
}
$('#btn_do_role_rem').onclick = () => {
    const userId = $('#role_user_select').value
    const roleId = $('#role_role_select').value
    if (!userId || !roleId) return toast('SELECCIONA USUARIO Y ROL', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/roles`, { action: 'remove', userId, roleId }, 'PRIVILEGIO REVOCADO POR LA FUERZA')
}


$('#btn_do_ban').onclick = () => {
    const userId = $('#ban_user_select').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/execute`, { action: 'ban', userId, reason: $('#ban_reason').value }, 'EL SUJETO HA SIDO ERRADICADO')
}


$('#btn_do_mute').onclick = () => {
    const userId = $('#mute_user_select').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/execute`, { action: 'timeout', userId, duration: $('#mute_time').value }, 'TRACTO VOCAL CERCENADO (TIMEOUT)')
}


$('#btn_do_say').onclick = () => {
    const channelId = $('#troll_channel_select').value
    if (!channelId) return toast('SELECCIONA UN CANAL PRIMERO', true)
    handleAction(`/api/guilds/${currentGuildId}/troll/say`, { channelId, message: $('#troll_payload').value }, 'PAYLOAD ENVIADO SIN DEJAR RASTRO')
}


const ecoDo = (action) => {
    const userId = $('#eco_user_select').value
    const amount = $('#eco_amount').value
    if (!userId) return toast('SELECCIONA UN MIEMBRO', true)
    handleAction(`/api/bot/economy/${currentGuildId}/action`, { userId, action, amount }, `ESTADO FINANCIERO ACTUALIZADO: ${action.toUpperCase()}`)
}

$('#btn_do_eco_add').onclick = () => ecoDo('add')
$('#btn_do_eco_rem').onclick = () => ecoDo('remove')
$('#btn_do_eco_set').onclick = () => ecoDo('set')
$('#btn_do_eco_wipe').onclick = () => { if (confirm('¿WIPE TOTAL DE ESTE USUARIO?')) ecoDo('reset') }





$('#btn_god_eval').onclick = async (e) => {
    const code = $('#god_eval_code').value
    if (!code) return toast('NO HAY CÓDIGO A EJECUTAR', true)
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>EVALUANDO...'

    try {
        const data = await api('/api/bot/eval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        })
        if (data) {
            $('#god_eval_output').textContent = `>[KERNEL_RESPONSE]: ${data.output}`
            toast('EJECUCIÓN NATIVA COMPLETADA')
        }
    } catch (err) { toast('ERROR DE CONEXIÓN MAESTRA', true) }
    e.target.innerHTML = '<i class="fa-solid fa-play mr-2"></i>INYECTAR RUNTIME'
}


$('#btn_god_bc').onclick = async (e) => {
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>ATRAVESANDO MATRIX...'
    try {
        const channelId = $('#broadcast_channel_select')?.value || ''
        const payload = $('#god_bc_payload').value

        if (channelId) {
            
            const data = await api(`/api/guilds/${currentGuildId}/troll/say`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId, message: payload })
            })
            if (data) toast('MENSAJE ENVIADO AL CANAL ESPECIFICADO')
        } else {
            
            const data = await api('/api/bot/broadcast', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload })
            })
            if (data) toast(`SEÑAL ENVIADA A ${data.count} REDES (${data.failed} FALLIDAS)`)
        }
    } catch (err) { toast('RECHAZO DE BROADCAST', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rss mr-2"></i>LANZAR SEÑAL'
}

$('#btn_god_eco_mass').onclick = () => handleAction('/api/bot/economy/mass', { amount: $('#god_eco_amount').value }, 'FONDOS INYECTADOS MUNDIALMENTE')
$('#btn_god_eco_reset').onclick = () => { if (confirm('⚠️ ¿RESETEAR TODA LA ECONOMÍA A $0?')) handleAction('/api/bot/economy/mass', { wipe: true }, '💥 FIN DE LA ECONOMÍA') }





let bureauCurrentLoadedId = null

$('#btn_bureau_search').onclick = async (e) => {
    const targetId = $('#bureau_search_id').value.trim()
    if (!targetId) return toast('NO INGRESÓ UN ID DE USUARIO', true)

    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>BUSCANDO EN MATRIZ...'
    try {
        const data = await api(`/api/bot/cedula/${targetId}`)

        if (!data || data.error) {
            $('#bureau_result_area').classList.add('hidden')
            toast(data?.error || 'CÉDULA INEXISTENTE / FALLO MANTRA', true)
        } else {
            bureauCurrentLoadedId = targetId
            $('#bureau_result_area').classList.remove('hidden')

            const nombres = data.nombres || data.nombreCompleto || 'N/A'
            const apellidos = data.apellidos || ''

            $('#bureau_name').textContent = `${nombres} ${apellidos}`
            $('#bureau_doc').textContent = data.numeroDocumento || data._id || 'N/A'
            $('#bureau_roblox').textContent = data.robloxUsername || 'N/A'
            $('#bureau_nac').textContent = data.nacionalidad || 'N/A'
            $('#bureau_fecha').textContent = data.fechaNacimiento ? `${data.fechaNacimiento} (${data.edad || '?'} años)` : `${data.edad || '?'} AÑOS`
            $('#bureau_sex').textContent = data.sexo || 'N/A'
            $('#bureau_sangre').textContent = data.grupoSanguineo || 'N/A'

            if (data.avatarUrl) {
                $('#bureau_avatar').src = data.avatarUrl
                $('#bureau_avatar').onerror = function () { this.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }
                $('#bureau_avatar').classList.remove('hidden')
                $('#bureau_avatar_placeholder').classList.add('hidden')
            } else {
                $('#bureau_avatar').classList.add('hidden')
                $('#bureau_avatar_placeholder').classList.remove('hidden')
            }

            window.lastLoadedCedula = data
            toast('REGISTRO OBTENIDO EXITOSAMENTE')
        }
    } catch (err) { toast('ERROR DE CONEXIÓN CON BBDD', true) }
    e.target.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-2"></i>BUSCAR CÉDULA'
}


$('#btn_bureau_edit').onclick = () => {
    const d = window.lastLoadedCedula
    if (!d) return
    $('#edit_ic_name').value = `${d.nombres || d.nombreCompleto || ''} ${d.apellidos || ''}`
    $('#edit_ic_roblox').value = d.robloxUsername || ''
    $('#edit_ic_job').value = d.profesion || ''
    $('#edit_ic_age').value = d.edad || 0
    $('#edit_ic_nac').value = d.nacionalidad || ''

    $('#modal_edit_cedula').classList.remove('hidden')
}

$('#btn_close_edit_cedula').onclick = () => $('#modal_edit_cedula').classList.add('hidden')

$('#btn_save_cedula').onclick = async (e) => {
    const d = window.lastLoadedCedula
    if (!d) return

    const payload = {
        nombreCompleto: $('#edit_ic_name').value,
        robloxUsername: $('#edit_ic_roblox').value,
        profesion: $('#edit_ic_job').value,
        edad: $('#edit_ic_age').value,
        nacionalidad: $('#edit_ic_nac').value
    }

    e.target.innerHTML = 'GUARDANDO...'
    try {
        const data = await api(`/api/bot/cedula/${d._id}/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        if (data && data.success) {
            toast('DNI RE-ACTUALIZADO EN LA MATRIX')
            $('#modal_edit_cedula').classList.add('hidden')
            $('#btn_bureau_search').click()
        } else { toast('ERROR AL EDITAR', true) }
    } catch (err) { toast('ERROR RED', true) }
    e.target.innerHTML = 'GUARDAR CAMBIOS EN MANTRA'
}

$('#btn_bureau_clearcache').onclick = async () => {
    if (!bureauCurrentLoadedId) return
    await handleAction(`/api/bot/cedula/${bureauCurrentLoadedId}/action`, { action: 'clearcache' }, 'CACHÉ DE ROBLOX BORRADO')
    $('#btn_bureau_search').click()
}

$('#btn_bureau_delete').onclick = async () => {
    if (!bureauCurrentLoadedId) return
    if (!confirm('🚨 ¿Destruir la cédula de este usuario?')) return
    await handleAction(`/api/bot/cedula/${bureauCurrentLoadedId}/action`, { action: 'delete' }, 'REGISTRO CIVIL EXTERMINADO')
    $('#bureau_result_area').classList.add('hidden')
    bureauCurrentLoadedId = null
}






$('#btn_prison_search').onclick = async (e) => {
    const targetId = ($('#prison_user_select')?.value || $('#prison_search_id')?.value || '').trim()
    if (!targetId || !currentGuildId) return toast('FALTAN DATOS O SERVIDOR NO SELECCIONADO', true)

    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>BUSCANDO...'
    try {
        const data = await api(`/api/bot/prison/${currentGuildId}/${targetId}`)
        if (!data || data.error) {
            $('#prison_result_area').classList.add('hidden')
            toast(data?.error || 'NO ENCONTRADO', true)
        } else {
            $('#prison_result_area').classList.remove('hidden')
            $('#prison_reason').textContent = data.reason || 'Sin motivo aparente'
            $('#prison_by').textContent = data.jailedBy || 'Sistema'
            window._prisonCurrentId = targetId
            toast('PRESO LOCALIZADO EN EL SISTEMA PENAL')
        }
    } catch (err) { toast('ERROR DE RED', true) }
    e.target.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-2"></i>BUSCAR PRESO'
}

$('#btn_prison_free').onclick = async () => {
    const targetId = window._prisonCurrentId
    if (!targetId || !currentGuildId) return
    if (!confirm('¿Liberar a este preso?')) return
    await handleAction(`/api/bot/prison/${currentGuildId}/${targetId}/free`, {}, 'EL PRISIONERO HA SIDO LIBERADO')
    $('#prison_result_area').classList.add('hidden')
    window._prisonCurrentId = null
}


$('#btn_shop_add').onclick = async () => {
    if (!currentGuildId) return toast('SELECCIONA UN SERVER', true)
    const payload = {
        nombre: $('#shop_name').value.trim(),
        precio: $('#shop_price').value,
        stock: -1,
        descripcion: 'Stock infinito - Web'
    }
    if (!payload.nombre || !payload.precio) return toast('Nombre y precio obligatorios', true)
    await handleAction(`/api/bot/shop/${currentGuildId}`, payload, 'ARTÍCULO REGISTRADO')
    $('#btn_shop_fetch').click()
}

$('#btn_shop_fetch').onclick = async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api(`/api/bot/shop/${currentGuildId}`)
        const div = $('#shop_list')
        div.innerHTML = ''
        if (data?.items && data.items.length > 0) {
            data.items.forEach(it => {
                div.innerHTML += `<div class="bg-black/50 border border-blue-500/20 p-2 rounded flex justify-between items-center">
                  <div><span class="text-blue-300 font-bold">${it.itemName}</span> <span class="text-xs text-blue-500">ID: ${it._id}</span></div>
                  <div class="text-yellow-400 font-black">$${it.price}</div>
               </div>`
            })
        } else {
            div.innerHTML = '<div class="text-blue-500/50 text-sm text-center mt-2">No hay artículos.</div>'
        }
    } catch (err) { toast('Error cargando tienda', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>REFRESCAR BBDD'
}


$('#btn_arcade_reset').onclick = async () => {
    if (!confirm('⚠️ ¿Borrar TODOS los scores de minijuegos?')) return
    await handleAction(`/api/bot/games/reset`, {}, 'PUNTUACIONES ARCADE ANIQUILADAS')
}


$('#btn_autorole_save').onclick = async () => {
    if (!currentGuildId) return toast('SELECCIONA UN SERVER', true)
    const roleId = $('#autorole_role_select').value
    if (!roleId) return toast('SELECCIONA UN ROL', true)
    await handleAction(`/api/bot/autorole/${currentGuildId}`, { roleId }, 'AUTO-ROL DE BIENVENIDA CONFIGURADO')
}


$('#btn_warns_search').onclick = async (e) => {
    const targetId = $('#warns_search_id').value.trim()
    if (!targetId || !currentGuildId) return toast('FALTAN DATOS', true)

    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>ESCANEANDO...'
    try {
        const data = await api(`/api/bot/warns/${currentGuildId}/${targetId}`)
        const div = $('#warns_list')
        div.innerHTML = ''
        if (data?.warns && data.warns.length > 0) {
            data.warns.forEach(w => {
                const dStr = new Date(w.timestamp).toLocaleDateString()
                div.innerHTML += `<div class="bg-black/50 border border-rose-500/30 p-3 rounded transform transition hover:-translate-y-1 hover:border-rose-400 duration-300">
                  <div class="text-rose-300 font-bold mb-1">MOTIVO: ${w.reason}</div>
                  <div class="text-xs text-rose-500/70 flex justify-between"><span>Sancionado por: ${w.moderatorId}</span> <span>${dStr}</span></div>
               </div>`
            })
        } else {
            div.innerHTML = '<div class="text-rose-500/50 text-sm text-center italic mt-8"><i class="fa-solid fa-shield-cat text-3xl block mb-2 opacity-30"></i>EXPEDIENTE LIMPIO.</div>'
        }
    } catch (err) { toast('Error al escanear BBDD', true) }
    e.target.innerHTML = '<i class="fa-solid fa-eye mr-2"></i>ESCANEAR EXPEDIENTE'
}


$('#btn_sug_fetch').onclick = async (e) => {
    if (!currentGuildId) return toast('SELECCIONA UN SERVER', true)
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Cargando...'
    try {
        const data = await api(`/api/bot/suggestions/${currentGuildId}`)
        const div = $('#sug_list')
        div.innerHTML = ''
        if (data?.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(s => {
                div.innerHTML += `<div class="bg-black/50 border border-teal-500/30 p-4 rounded relative group transition transform hover:scale-[1.01] duration-300">
                  <div class="text-teal-400 font-bold mb-2 text-xs">Autor: ${s.authorId || s.userId || 'Desconocido'}</div>
                  <div class="text-sm text-white mb-3 italic">"${s.suggestionText || s.suggestion || s.title || s.description || 'Sin texto'}"</div>
                  <div class="flex gap-4 text-xs font-black">
                     <span class="text-green-400"><i class="fa-solid fa-arrow-up"></i> ${s.upvotes || 0}</span>
                     <span class="text-red-400"><i class="fa-solid fa-arrow-down"></i> ${s.downvotes || 0}</span>
                     <span class="text-teal-500/50">ID: ${s._id}</span>
                  </div>
                  <button onclick="window.delSug('${s._id}')" class="absolute top-4 right-4 text-rose-500 hover:text-white bg-rose-900/50 border border-rose-500/50 hover:bg-rose-500 rounded px-3 py-1 transition text-xs opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash mr-1"></i> Purgar</button>
               </div>`
            })
        } else {
            div.innerHTML = '<div class="text-teal-500/50 text-sm text-center italic mt-10"><i class="fa-solid fa-cat text-4xl block mb-2 opacity-50"></i><br>Buzón Vacío. Miauw.</div>'
        }
    } catch (err) { toast('Error al cargar buzón', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>Cargar Buzón'
}




document.addEventListener('input', e => {
    if (e.target.classList.contains('role-search-input')) {
        const query = e.target.value.toLowerCase()
        const targetId = e.target.getAttribute('data-target')
        const select = document.getElementById(targetId)
        if (!select) return
        const options = select.options
        for (let i = 0; i < options.length; i++) {
            const opt = options[i]
            if (opt.value === "") continue
            const text = opt.text.toLowerCase()
            opt.style.display = (text.includes(query) || opt.value.includes(query) || !query) ? 'block' : 'none'
        }
    }
})

window.delSug = async (sugId) => {
    if (!confirm('¿Eliminar esta sugerencia?')) return
    try {
        const data = await api(`/api/bot/suggestions/${currentGuildId}/${sugId}`, { method: 'DELETE' })
        if (data) {
            toast('Sugerencia Exterminada')
            $('#btn_sug_fetch').click()
        }
    } catch (e) { toast('Error RED', true) }
}






$('#btn_do_kick')?.addEventListener('click', () => {
    const userId = $('#kick_user_select').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/execute`, { action: 'kick', userId, reason: $('#kick_reason').value }, 'EL SUJETO HA SIDO EXPULSADO 🚪')
})


$('#btn_do_dm')?.addEventListener('click', async (e) => {
    const userId = $('#dm_user_select').value
    const message = $('#dm_message').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    if (!message) return toast('ESCRIBE UN MENSAJE', true)
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>ENVIANDO...'
    try {
        await api(`/api/guilds/${currentGuildId}/mod/dm`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message })
        })
        toast('DM ENVIADO EXITOSAMENTE 📨')
        $('#dm_message').value = ''
    } catch (err) { toast('Error enviando DM', true) }
    e.target.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i>ENVIAR DM'
})


$('#btn_do_nick')?.addEventListener('click', () => {
    const userId = $('#nick_user_select').value
    const nickname = $('#nick_value').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    if (!nickname) return toast('ESCRIBE UN APODO', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/nickname`, { userId, nickname, action: 'force' }, 'APODO FORZADO EXITOSAMENTE 📛')
})
$('#btn_do_nick_remove')?.addEventListener('click', () => {
    const userId = $('#nick_user_select').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/nickname`, { userId, nickname: '', action: 'remove' }, 'APODO LIBERADO ✅')
})






$('#btn_esc_save')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return toast('SELECCIONA UN SERVER', true)
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>GUARDANDO...'
    try {
        await api(`/api/bot/warn-escalation/${currentGuildId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                muteWarns: parseInt($('#esc_mute_warns').value) || 3,
                muteDuration: parseInt($('#esc_mute_dur').value) || 60,
                banWarns: parseInt($('#esc_ban_warns').value) || 5
            })
        })
        toast('ESCALAMIENTO CONFIGURADO')
    } catch (err) { toast('Error', true) }
    e.target.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>GUARDAR ESCALAMIENTO'
})


$('#btn_seniority_fetch')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api(`/api/bot/seniority/${currentGuildId}`)
        const div = $('#seniority_list')
        div.innerHTML = ''
        if (data?.rules && data.rules.length > 0) {
            data.rules.forEach(r => {
                div.innerHTML += `<div class="bg-black/50 border border-amber-500/20 p-3 rounded flex justify-between items-center">
                   <div><span class="text-amber-300 font-bold">${r.days} días</span> → <span class="text-amber-200">Rol: ${r.roleId}</span></div>
                </div>`
            })
        } else {
            div.innerHTML = '<p class="text-amber-400/50 text-sm text-center mt-4">No hay reglas de antigüedad. Usa /asignar-antiguedad en Discord.</p>'
        }
    } catch (err) { toast('Error cargando seniority', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>CARGAR CONFIGURACIÓN ACTUAL'
})


$('#btn_lock_channel')?.addEventListener('click', () => {
    const channelId = $('#lock_channel_select').value
    if (!channelId) return toast('SELECCIONA UN CANAL', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/channel-lock`, { channelId, action: 'lock' }, 'CANAL BLOQUEADO 🔒')
})
$('#btn_unlock_channel')?.addEventListener('click', () => {
    const channelId = $('#lock_channel_select').value
    if (!channelId) return toast('SELECCIONA UN CANAL', true)
    handleAction(`/api/guilds/${currentGuildId}/mod/channel-lock`, { channelId, action: 'unlock' }, 'CANAL DESBLOQUEADO 🔓')
})


$('#btn_wl_fetch')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api(`/api/bot/whitelist/${currentGuildId}`)
        const div = $('#whitelist_display')
        div.innerHTML = ''
        if (data?.users && data.users.length > 0) {
            data.users.forEach(uid => {
                div.innerHTML += `<span class="px-3 py-1 bg-black/60 border border-amber-500/30 rounded text-xs text-amber-200">${uid}</span>`
            })
        } else {
            div.innerHTML = '<span class="text-amber-400/50 text-sm">Whitelist vacía</span>'
        }
        if (data?.roles && data.roles.length > 0) {
            data.roles.forEach(rid => {
                div.innerHTML += `<span class="px-3 py-1 bg-black/60 border border-green-500/30 rounded text-xs text-green-200">Rol: ${rid}</span>`
            })
        }
    } catch (err) { toast('Error', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>VER WHITELIST ACTUAL'
})


$('#btn_stats_fetch')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api(`/api/bot/stats/${currentGuildId}`)
        if (data) {
            $('#stat_members').textContent = data.memberCount || cachedMembers.length || '--'
            $('#stat_channels').textContent = data.channelCount || cachedChannels.length || '--'
            $('#stat_roles').textContent = data.roleCount || cachedRoles.length || '--'
            $('#stat_commands').textContent = data.commandsUsed || '--'

            const cmdList = $('#stats_cmd_list')
            cmdList.innerHTML = ''
            if (data.topCommands && data.topCommands.length > 0) {
                data.topCommands.forEach((c, i) => {
                    const pct = data.topCommands[0].count > 0 ? (c.count / data.topCommands[0].count * 100) : 0
                    cmdList.innerHTML += `<div class="flex items-center gap-3">
                       <span class="text-xs text-indigo-400 w-6 text-right">${i + 1}.</span>
                       <span class="text-sm text-white font-bold flex-1">/${c.name || c._id}</span>
                       <div class="w-32 bg-indigo-900/30 rounded-full h-2"><div class="bg-indigo-500 h-2 rounded-full" style="width:${pct}%"></div></div>
                       <span class="text-xs text-indigo-300 w-12 text-right">${c.count}x</span>
                    </div>`
                })
            } else {
                cmdList.innerHTML = '<p class="text-indigo-400/50 text-sm text-center">No hay datos de comandos aún.</p>'
            }
        }
    } catch (err) { toast('Error cargando stats', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>CARGAR ESTADÍSTICAS'
})


$('#btn_audit_fetch')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>...'
    try {
        const data = await api(`/api/bot/audit/${currentGuildId}`)
        const div = $('#audit_list')
        div.innerHTML = ''
        if (data?.logs && data.logs.length > 0) {
            data.logs.forEach(log => {
                const d = new Date(log.timestamp || log.createdAt).toLocaleString()
                div.innerHTML += `<div class="bg-black/40 border border-indigo-500/10 p-3 rounded text-xs flex justify-between items-center hover:border-indigo-400/30 transition">
                   <div><span class="text-indigo-300 font-bold">${log.action || log.type || 'ACCIÓN'}</span> <span class="text-white/70">— ${log.details || log.reason || ''}</span></div>
                   <span class="text-indigo-400/50 hacker-font text-[10px]">${d}</span>
                </div>`
            })
        } else {
            div.innerHTML = '<p class="text-indigo-400/50 text-sm text-center mt-10">No hay logs registrados aún.</p>'
        }
    } catch (err) { toast('Error cargando audit', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>Cargar'
})


$('#btn_botinfo_fetch')?.addEventListener('click', async (e) => {
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api('/api/bot/status')
        if (data) {
            $('#bi_ping').textContent = `${data.ping || '?'}ms`
            const upSec = data.uptime || 0
            const hours = Math.floor(upSec / 3600)
            const mins = Math.floor((upSec % 3600) / 60)
            $('#bi_uptime').textContent = `${hours}h ${mins}m`
            $('#bi_ram').textContent = data.memoryUsage ? `${Math.round(data.memoryUsage.rss / 1024 / 1024)}MB` : '?'
            $('#bi_guilds').textContent = data.guildCount || '?'
            $('#bi_cmds').textContent = data.commandCount || '?'
            $('#bi_node').textContent = data.nodeVersion || process?.version || '?'
        }
    } catch (err) { toast('Error', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>CARGAR INFO'
})


const embedInputs = ['embed_title', 'embed_desc', 'embed_color', 'embed_footer']
embedInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
        $('#embed_preview_title').textContent = $('#embed_title').value || 'Título'
        $('#embed_preview_desc').textContent = $('#embed_desc').value || 'Descripción...'
        $('#embed_preview_footer').textContent = $('#embed_footer').value || ''
        const color = $('#embed_color').value || '#9b59b6'
        $('#embed_preview_box').style.borderColor = color
    })
})

$('#btn_embed_send')?.addEventListener('click', async (e) => {
    const channelId = $('#embed_channel').value
    if (!channelId) return toast('SELECCIONA UN CANAL', true)
    if (!$('#embed_title').value && !$('#embed_desc').value) return toast('ESCRIBE ALGO EN EL EMBED', true)

    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>ENVIANDO...'
    try {
        await api(`/api/guilds/${currentGuildId}/troll/embed`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channelId,
                title: $('#embed_title').value,
                description: $('#embed_desc').value,
                color: $('#embed_color').value,
                image: $('#embed_image').value,
                footer: $('#embed_footer').value
            })
        })
        toast('EMBED ENVIADO AL CANAL 🚀')
    } catch (err) { toast('Error enviando embed', true) }
    e.target.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i>ENVIAR EMBED AL CANAL'
})


$('#btn_notif_fetch')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api(`/api/bot/notifications/${currentGuildId}`)
        const div = $('#notif_list')
        div.innerHTML = ''
        if (data?.notifications && data.notifications.length > 0) {
            data.notifications.forEach(n => {
                div.innerHTML += `<div class="bg-black/40 border border-lime-500/20 p-3 rounded flex items-center gap-3">
                   <i class="fa-brands fa-${n.platform === 'twitch' ? 'twitch text-purple-400' : 'youtube text-red-400'} text-xl"></i>
                   <div class="flex-1"><span class="text-lime-200 font-bold">${n.streamerName || n.channelName || 'N/A'}</span><br><span class="text-xs text-lime-400/50">Canal: ${n.discordChannelId || 'N/A'}</span></div>
                </div>`
            })
        } else {
            div.innerHTML = '<p class="text-lime-400/50 text-sm text-center">No hay notificaciones configuradas.</p>'
        }
    } catch (err) { toast('Error', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>VER NOTIFICACIONES CONFIGURADAS'
})


$('#btn_reminders_fetch')?.addEventListener('click', async (e) => {
    if (!currentGuildId) return
    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>CARGANDO...'
    try {
        const data = await api(`/api/bot/reminders/${currentGuildId}`)
        const div = $('#reminders_list')
        div.innerHTML = ''
        if (data?.reminders && data.reminders.length > 0) {
            data.reminders.forEach(r => {
                const when = new Date(r.triggerAt || r.remindAt).toLocaleString()
                div.innerHTML += `<div class="bg-black/40 border border-lime-500/20 p-3 rounded">
                   <div class="text-lime-200 font-bold text-sm">${r.message || r.text || 'Sin mensaje'}</div>
                   <div class="text-[10px] text-lime-400/50 mt-1">Para: ${r.userId} • ${when}</div>
                </div>`
            })
        } else {
            div.innerHTML = '<p class="text-lime-400/50 text-sm text-center">No hay recordatorios activos.</p>'
        }
    } catch (err) { toast('Error', true) }
    e.target.innerHTML = '<i class="fa-solid fa-rotate mr-2"></i>CARGAR RECORDATORIOS'
})


const originalFetchChannels = fetchChannels
window._populateExtraChannelSelects = () => {
    const extraSelects = ['lock_channel_select', 'embed_channel']
    extraSelects.forEach(id => {
        const el = document.getElementById(id)
        if (!el || !cachedChannels.length) return
        el.innerHTML = '<option value="">-- SELECCIONAR CANAL --</option>'
        cachedChannels.forEach(c => {
            el.innerHTML += `<option value="${c.id}"># ${c.name}</option>`
        })
    })
}

const _origFetchChannels = fetchChannels.bind ? fetchChannels : null
