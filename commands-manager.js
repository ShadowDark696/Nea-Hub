// Command Management Module

const COMMAND_CATEGORIES = {
  music: {
    name: '🎵 MÚSICA',
    color: '#FF1493',
    commands: [
      { name: 'play', desc: 'Reproducir canción', params: ['canción'] },
      { name: 'pause', desc: 'Pausar reproducción', params: [] },
      { name: 'resume', desc: 'Reanudar reproducción', params: [] },
      { name: 'skip', desc: 'Saltar canción', params: [] },
      { name: 'stop', desc: 'Detener música', params: [] },
      { name: 'queue', desc: 'Ver cola de canciones', params: [] },
      { name: 'volume', desc: 'Cambiar volumen', params: ['volumen (0-100)'] },
      { name: 'nowplaying', desc: 'Canción actual', params: [] }
    ]
  },
  roles: {
    name: '👥 ROLES & PERMISOS',
    color: '#4169E1',
    commands: [
      { name: 'roles', desc: 'Ver roles', params: [] },
      { name: 'roles-setup', desc: 'Configurar roles', params: ['rolId'] },
      { name: 'actualizar-roles', desc: 'Actualizar roles', params: [] },
      { name: 'asignar-rol-global', desc: 'Asignar rol a usuario', params: ['user', 'role'] },
      { name: 'otorgar-todos-los-roles', desc: 'Dar todos los roles', params: ['user'] },
      { name: 'quitar-todos-los-roles', desc: 'Quitar todos los roles', params: ['user'] },
      { name: 'setrango', desc: 'Establecer rango', params: ['user', 'rango'] },
      { name: 'darpermiso', desc: 'Dar permiso', params: ['user', 'permiso'] },
      { name: 'quitarpermiso', desc: 'Quitar permiso', params: ['user', 'permiso'] },
      { name: 'actualizar-permisos-roles', desc: 'Actualizar permisos', params: [] },
      { name: 'actualizar-canales', desc: 'Actualizar canales', params: [] },
      { name: 'bloquear-canales', desc: 'Bloquear canales', params: ['channel'] }
    ]
  },
  moderation: {
    name: '⚖️ MODERACIÓN',
    color: '#DC143C',
    commands: [
      { name: 'ban', desc: 'Banear usuario', params: ['user', 'razón'] },
      { name: 'kick', desc: 'Expulsar usuario', params: ['user', 'razón'] },
      { name: 'mute', desc: 'Silenciar usuario', params: ['user', 'tiempo'] },
      { name: 'dm', desc: 'Enviar DM privado', params: ['user', 'mensaje'] },
      { name: 'remove', desc: 'Eliminar mensajes', params: ['cantidad'] },
      { name: 'removerolessetup', desc: 'Quitar setup de roles', params: [] },
      { name: 'permitir-publicos', desc: 'Permitir públicos', params: [] },
      { name: 'webhook-fake', desc: 'Crear webhook falso', params: ['nombre'] }
    ]
  },
  entertainment: {
    name: '🎮 ENTRETENIMIENTO',
    color: '#FFD700',
    commands: [
      { name: 'chat', desc: 'Chat general', params: ['mensaje'] },
      { name: 'chat-ai', desc: 'Chat con IA', params: ['pregunta'] },
      { name: 'chat-bot', desc: 'Chat bot', params: ['mensaje'] },
      { name: 'avatar', desc: 'Ver avatar de usuario', params: ['user'] },
      { name: 'embed-chimba', desc: 'Crear embed bonito', params: ['título', 'descripción'] },
      { name: 'search', desc: 'Buscar en YouTube', params: ['término'] },
      { name: 'sugerencia', desc: 'Hacer sugerencia', params: ['sugerencia'] },
      { name: 'soporte', desc: 'Solicitar soporte', params: ['problema'] }
    ]
  },
  config: {
    name: '⚙️ CONFIGURACIÓN',
    color: '#32CD32',
    commands: [
      { name: 'setup', desc: 'Configuración inicial', params: [] },
      { name: 'bienvenida', desc: 'Mensajeño bienvenida', params: ['mensaje'] },
      { name: 'filtro', desc: 'Filtro de palabras', params: ['palabra', 'reemplazo'] },
      { name: 'togglefiltro', desc: 'Activar/desactivar filtro', params: [] },
      { name: 'whitelist', desc: 'Lista blanca de usuarios', params: ['user'] },
      { name: 'forzarnick', desc: 'Forzar nick', params: ['user', 'nick'] },
      { name: 'cambiarapodo', desc: 'Cambiar apodo', params: ['apodo'] },
      { name: 'cambiarnick', desc: 'Cambiar nick', params: ['nick'] },
      { name: 'permitir-publicos', desc: 'Permitir públicos', params: [] },
      { name: 'promotional', desc: 'Modo promocional', params: [] }
    ]
  },
  cedulas: {
    name: '🆔 CÉDULAS & USUARIOS',
    color: '#FF6347',
    commands: [
      { name: 'RegistrarCedula', desc: 'Registrar cédula', params: ['cédula', 'nombre'] },
      { name: 'cedula-de', desc: 'Ver cédula de usuario', params: ['user'] },
      { name: 'vercedula', desc: 'Ver mi cédula', params: [] },
      { name: 'editar-cedula', desc: 'Editar cédula', params: ['campo', 'valor'] },
      { name: 'enviar-obtener-cedula', desc: 'Enviar/obtener cédula', params: ['user'] },
      { name: 'fake-nick', desc: 'Nick falso', params: ['user', 'nick'] }
    ]
  },
  info: {
    name: 'ℹ️ INFO & UTILIDADES',
    color: '#1E90FF',
    commands: [
      { name: 'info', desc: 'Información del bot', params: [] },
      { name: 'ping', desc: 'Ping del bot', params: [] },
      { name: 'stats', desc: 'Estadísticas', params: [] },
      { name: 'ayuda', desc: 'Ayuda de comandos', params: ['comando'] },
      { name: 'uso', desc: 'Uso de comandos', params: [] },
      { name: 'test-mensaje', desc: 'Enviar mensaje de prueba', params: ['mensaje'] },
      { name: 'test-crear-rol', desc: 'Crear rol de prueba', params: ['nombre'] }
    ]
  },
  admin: {
    name: '🔐 ADMIN & ESPECIALES',
    color: '#8B0000',
    commands: [
      { name: 'hidden-command', desc: 'Comando oculto', params: [] },
      { name: 'ephemeral-message', desc: 'Mensaje efímero', params: ['mensaje'] },
      { name: 'hide', desc: 'Ocultar', params: [] },
      { name: 'hide-embed', desc: 'Ocultar embed', params: [] },
      { name: 'fullhide', desc: 'Ocultar todo', params: [] },
      { name: 'join', desc: 'Unirse a canal', params: [] },
      { name: 'leave', desc: 'Salir del canal', params: [] },
      { name: 'promocionar', desc: 'Promover usuario', params: ['user', 'rango'] }
    ]
  }
};

// Ejecutar comando
async function executeCommand(category, commandName, params) {
  const endpoint = `/api/commands/${category}/${commandName}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('nea_sid')}`
      },
      body: JSON.stringify({ params })
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }

    return await res.json();
  } catch (e) {
    console.error('Command execution failed:', e);
    throw e;
  }
}

// Exportar para uso en dashboard
window.COMMAND_CATEGORIES = COMMAND_CATEGORIES;
window.executeCommand = executeCommand;
