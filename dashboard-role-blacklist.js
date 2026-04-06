// ===================== ROLE BLACKLIST SECTION =====================

let blacklistSelectedRoles = [];

// Load members and roles when panel is shown
function loadBlacklistPanel() {
    if (!currentGuildId) return;

    // Load members list
    renderPremiumList('#blacklist_user_list', cachedMembers || [], '#blacklist_user_select')

    // Load roles list
    renderPremiumRoleList('#blacklist_role_list', cachedRoles || [], '#blacklist_temp_role')

    // Load current blacklist
    loadBlacklistDisplay()
}

// Search functionality for users
$('#blacklist_user_search')?.addEventListener('input', (e) => {
    renderPremiumList('#blacklist_user_list', cachedMembers || [], '#blacklist_user_select', e.target.value)
})

// Search functionality for roles
$('#blacklist_role_search')?.addEventListener('input', (e) => {
    renderPremiumRoleList('#blacklist_role_list', cachedRoles || [], '#blacklist_temp_role', e.target.value)
})

// Handle role selection (multi-select)
function addRoleToBlacklist(roleId, roleName, roleColor) {
    if (!blacklistSelectedRoles.find(r => r.id === roleId)) {
        blacklistSelectedRoles.push({ id: roleId, name: roleName, color: roleColor })
        updateBlacklistRolesTags()
    }
}

function removeRoleFromBlacklist(roleId) {
    blacklistSelectedRoles = blacklistSelectedRoles.filter(r => r.id !== roleId)
    updateBlacklistRolesTags()
}

function updateBlacklistRolesTags() {
    const container = $('#blacklist_roles_tags')
    if (blacklistSelectedRoles.length === 0) {
        container.innerHTML = '<span class="text-xs text-red-300/50">Ninguno</span>'
        return
    }
    container.innerHTML = blacklistSelectedRoles
        .map(r => `<span class="px-2 py-1 rounded text-xs font-bold text-white" style="background: ${r.color || '#999'}; cursor: pointer;" onclick="removeRoleFromBlacklist('${r.id}')" title="Click para remover">
            ${r.name} ✕
        </span>`)
        .join('')
}

// Load and display current blacklist
async function loadBlacklistDisplay() {
    if (!currentGuildId) return
    const container = $('#blacklist_list_container')
    try {
        const data = await api(`/api/bot/role-blacklist/${currentGuildId}`)
        if (!data || !data.blacklist) {
            container.innerHTML = '<p class="text-xs text-red-300/50 text-center">Sin datos de blacklist</p>'
            return
        }

        let html = ''
        for (const [userId, info] of Object.entries(data.blacklist)) {
            try {
                const member = cachedMembers.find(m => m.user.id === userId)
                const userName = member ? (member.nick || member.user.username) : userId
                const roleNames = info.roles
                    .map(rid => {
                        const role = cachedRoles.find(r => r.id === rid)
                        return role ? role.name : rid
                    })
                    .join(', ')

                html += `
                <div class="bg-black/50 border border-red-500/20 p-3 rounded flex justify-between items-center mb-2">
                    <div>
                        <div class="text-xs font-bold text-red-300">${userName}</div>
                        <div class="text-[10px] text-red-300/60">${roleNames}</div>
                        ${info.reason ? `<div class="text-[9px] text-red-300/50 mt-1">Razón: ${info.reason}</div>` : ''}
                    </div>
                    <button onclick="removeUserFromBlacklist('${userId}')" class="text-red-400 hover:text-red-200 text-sm">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                `
            } catch (e) { console.error('render blacklist item', e) }
        }

        if (!html) {
            container.innerHTML = '<p class="text-xs text-red-300/50 text-center">Blacklist vacía</p>'
        } else {
            container.innerHTML = html
        }
    } catch (e) {
        console.error('Load blacklist error', e)
        container.innerHTML = '<p class="text-xs text-red-500 text-center">Error cargando</p>'
    }
}

// Add user to blacklist
$('#btn_do_blacklist')?.addEventListener('click', async (e) => {
    const userId = $('#blacklist_user_select').value
    const reason = $('#blacklist_reason').value

    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    if (blacklistSelectedRoles.length === 0) return toast('SELECCIONA AL MENOS UN ROL', true)

    e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>AGREGANDO...'
    try {
        await api(`/api/bot/role-blacklist/${currentGuildId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                roleIds: blacklistSelectedRoles.map(r => r.id),
                reason
            })
        })
        toast('✅ Agregado a blacklist')
        $('#blacklist_reason').value = ''
        blacklistSelectedRoles = []
        updateBlacklistRolesTags()
        $('#blacklist_user_select').value = ''
        loadBlacklistDisplay()
    } catch (e) {
        toast('Error agregando a blacklist', true)
    }
    e.target.innerHTML = '<i class="fa-solid fa-shield-halved mr-2"></i>AGREGAR BLACKLIST'
})

// Remove user from blacklist
async function removeUserFromBlacklist(userId) {
    if (!confirm('¿Remover de blacklist?')) return
    try {
        await api(`/api/bot/role-blacklist/${currentGuildId}/${userId}`, { method: 'DELETE' })
        toast('✅ Removido de blacklist')
        loadBlacklistDisplay()
    } catch (e) {
        toast('Error removiendo', true)
    }
}

// Remove button handler
$('#btn_do_blacklist_remove')?.addEventListener('click', async (e) => {
    const userId = $('#blacklist_user_select').value
    if (!userId) return toast('SELECCIONA UN USUARIO', true)
    await removeUserFromBlacklist(userId)
})

// Override renderPremiumList to support multi-select for roles
const originalRenderPremiumRoleList = window.renderPremiumRoleList || function () { }
window.renderPremiumRoleListMulti = function (containerId, roles, tempInputId, filter = '') {
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
        const isSelected = blacklistSelectedRoles.find(sr => sr.id === r.id)

        return `
      <div class="member-card flex items-center gap-3 p-3 rounded-lg cursor-pointer ${isSelected ? 'selected' : ''}" onclick="addRoleToBlacklist('${r.id}', '${r.name.replace(/'/g, "\\'")}', '${color}')">
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style="background:${color}; box-shadow: 0 0 12px ${color}55;">
          <i class="fa-solid fa-shield-halved text-white text-sm"></i>
        </div>
        <div class="overflow-hidden">
          <div class="text-sm font-bold truncate" style="color:${color}">${r.name}</div>
          <div class="text-[10px] opacity-50 truncate">Pos: ${r.position}</div>
        </div>
      </div>
    `
    }).join('')

    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-xs text-red-400/50 p-6 text-center">No se encontraron roles.</div>'
    }
}

// Update search to use multi-select
$('#blacklist_role_search')?.addEventListener('input', (e) => {
    renderPremiumRoleListMulti('#blacklist_role_list', cachedRoles || [], '#blacklist_temp_role', e.target.value)
})
