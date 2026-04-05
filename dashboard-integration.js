



function initializeCommandsPanel() {
  const sidebar = document.getElementById('sidebar-nav');

  
  const commandSection = document.createElement('div');
  commandSection.innerHTML = `
    <div class="text-xs text-purple-500/70 hacker-font mt-6 mb-2 pl-2">⚙️ CONTROL DE COMANDOS</div>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-music">
      <i class="fa-solid fa-music w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">🎵 Música (8)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-roles">
      <i class="fa-solid fa-users-gear w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">👥 Roles (12)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-moderation">
      <i class="fa-solid fa-gavel w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">⚖️ Moderación (8)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-entertainment">
      <i class="fa-solid fa-gamepad w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">🎮 Entretenimiento (8)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-config">
      <i class="fa-solid fa-sliders w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">⚙️ Configuración (10)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-cedulas">
      <i class="fa-solid fa-id-card w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">🆔 Cédulas (6)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-info">
      <i class="fa-solid fa-circle-info w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">ℹ️ Info (7)</span>
    </button>

    <button class="menu-item sidebar-btn w-full text-left px-4 py-3 rounded text-purple-200 font-bold flex items-center" data-target="mod-admin">
      <i class="fa-solid fa-lock w-6 text-center text-purple-400"></i>
      <span class="ml-2 text-sm">🔐 Admin (7)</span>
    </button>
  `;

  sidebar.appendChild(commandSection);

  
  document.querySelectorAll('.menu-item[data-target^="mod-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCommandModule(btn.dataset.target);
    });
  });
}


async function loadCommandModule(module) {
  const mainContent = document.getElementById('main-content') || document.querySelector('main');

  
  const response = await fetch('commands-panel.html');
  const html = await response.text();

  
  const categoryMap = {
    'mod-music': 'music',
    'mod-roles': 'roles',
    'mod-moderation': 'moderation',
    'mod-entertainment': 'entertainment',
    'mod-config': 'config',
    'mod-cedulas': 'cedulas',
    'mod-info': 'info',
    'mod-admin': 'admin'
  };

  mainContent.innerHTML = html;

  
  setTimeout(() => {
    const category = categoryMap[module] || 'all';
    if (window.renderCommands) {
      window.renderCommands(category);
    }
  }, 100);
}


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sidebar-nav')) {
    initializeCommandsPanel();
  }
});

console.log('✅ Commands panel integration loaded');
