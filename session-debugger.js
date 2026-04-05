/**
 * Session Utilities
 */

const SESSION_DEBUG = {
    log: (title, data) => console.log(`%c[Debug] ${title}`, 'color: #9d4edd; font-weight: bold;', data),

    checkURL() {
        const params = new URLSearchParams(window.location.search);
        const sid = params.get('sid');
        this.log('URL Parameters', {
            url: window.location.href,
            hasSessionId: !!sid,
            sessionId: sid ? `${sid.substring(0, 10)}...` : 'NONE'
        });
        return sid;
    },

    checkStorage() {
        this.log('LocalStorage', {
            nea_sid: localStorage.getItem('nea_sid') ? '✓ found' : '✗ not found',
            oauth_validator_sid: localStorage.getItem('oauth_validator_sid') ? '✓ found' : '✗ not found'
        });
    },

    checkCookies() {
        const cookies = document.cookie.split(';').reduce((acc, c) => {
            const [key, value] = c.trim().split('=');
            acc[key] = value ? '✓' : '✗';
            return acc;
        }, {});
        this.log('Cookies', cookies);
    },

    async checkBackendHealth() {
        try {
            const response = await fetch('https://rupc-qzce.onrender.com/api/health');
            const data = await response.json();
            this.log('Backend Health', { status: response.status, data });
        } catch (err) {
            this.log('Backend Health - ERROR', err.message);
        }
    },

    async checkSession() {
        try {
            const response = await fetch('https://rupc-qzce.onrender.com/api/session', {
                credentials: 'include'
            });
            const data = await response.json();
            this.log('Backend Session', data);
        } catch (err) {
            this.log('Backend Session - ERROR', err.message);
        }
    },

    async checkUser() {
        try {
            const response = await fetch('https://rupc-qzce.onrender.com/api/user', {
                credentials: 'include'
            });
            const data = await response.json();
            this.log('Backend User', data);
        } catch (err) {
            this.log('Backend User - ERROR', err.message);
        }
    },

    async checkGuilds() {
        try {
            const response = await fetch('https://rupc-qzce.onrender.com/api/guilds', {
                credentials: 'include'
            });
            const data = await response.json();
            this.log('Backend Guilds', {
                success: data.success,
                count: data.count,
                guilds: data.guilds ? data.guilds.slice(0, 2) : null
            });
        } catch (err) {
            this.log('Backend Guilds - ERROR', err.message);
        }
    },

    checkDOM() {
        this.log('DOM Elements', {
            '#view-selector': document.getElementById('view-selector') ? '✓' : '✗',
            '#view-dashboard': document.getElementById('view-dashboard') ? '✓' : '✗',
            '#grid-container': document.getElementById('grid-container') ? '✓' : '✗',
            '#authBtn': document.getElementById('authBtn') ? '✓' : '✗'
        });
    },

    async runAll() {
        console.clear();
        console.log('%c\n🔍 RUPC SESSION DEBUGGER RUNNING\n', 'color: #9d4edd; font-size: 14px; font-weight: bold;');

        this.checkURL();
        this.checkStorage();
        this.checkCookies();
        this.checkDOM();

        await this.checkBackendHealth();
        await this.checkSession();

        if (this.checkURL()) {
            await this.checkUser();
            await this.checkGuilds();
        }

        console.log('%c\n✅ DEBUGGING COMPLETE\n', 'color: #00ff9d; font-weight: bold; font-size: 12px;');
    }
};

// Auto-export to window for easy access
window.SESSION_DEBUG = SESSION_DEBUG;
console.log('%c💡 Tip: Run SESSION_DEBUG.runAll() to check everything', 'color: #9d4edd; font-style: italic;');
