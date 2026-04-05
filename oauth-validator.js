/**
 * OAuth Session Manager
 */

console.log('%c🔐 Session Manager Loaded', 'color: #9d4edd; font-size: 14px; font-weight: bold;');

const OAUTH_VALIDATOR = {
    backend: 'https://rupc-qzce.onrender.com',

    async validateOAuthFlow() {
        console.group('%c🔐 VALIDATION', 'color: #9d4edd; font-weight: bold; font-size: 12px;');

        const urlParams = new URLSearchParams(window.location.search);
        const sid = urlParams.get('sid');
        console.log('%c□ URL Check', 'color: #00ff9d; font-weight: bold;', {
            hasSessionId: !!sid,
            sessionId: sid ? sid.substring(0, 10) + '...' : 'NONE'
        });

        if (!sid) {
            console.warn('%c⚠️  Session not found', 'color: #ff9d4e');
            console.groupEnd();
            return false;
        }

        localStorage.setItem('oauth_validator_sid', sid);
        console.log('%c□ Storage Check', 'color: #00ff9d; font-weight: bold;', {
            storedInLocalStorage: localStorage.getItem('oauth_validator_sid') ? '✓' : '✗'
        });

        try {
            console.log('%c□ Validating...', 'color: #00ff9d; font-weight: bold;');
            const sessionResponse = await fetch(`${this.backend}/api/session`, {
                credentials: 'include',
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!sessionResponse.ok) {
                throw new Error(`HTTP ${sessionResponse.status}`);
            }

            const sessionData = await sessionResponse.json();
            console.log('%c✓ Valid', 'color: #00ff9d;', sessionData);

            if (!sessionData.authenticated) {
                throw new Error('Session data shows not authenticated');
            }
        } catch (err) {
            console.error('%c✗ Validation Failed', 'color: #ff003c;', err.message);
            console.groupEnd();
            return false;
        }

        try {
            console.log('%c□ Fetching Data...', 'color: #00ff9d; font-weight: bold;');
            const userResponse = await fetch(`${this.backend}/api/user`, {
                credentials: 'include',
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const userData = await userResponse.json();
            if (!userData.success) {
                throw new Error(userData.message || 'Unsuccessful response');
            }

            console.log('%c✓ Data Retrieved', 'color: #00ff9d;', {
                username: userData.user.username,
                id: userData.user.id
            });
        } catch (err) {
            console.error('%c✗ Data Fetch Failed', 'color: #ff003c;', err.message);
            console.groupEnd();
            return false;
        }

        try {
            console.log('%c□ Fetching Servers...', 'color: #00ff9d; font-weight: bold;');
            const guildsResponse = await fetch(`${this.backend}/api/guilds`, {
                credentials: 'include',
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const guildsData = await guildsResponse.json();
            if (!guildsData.success) {
                throw new Error(guildsData.message || 'Failed to fetch servers');
            }

            console.log(`%c✓ Servers Retrieved: ${guildsData.count}`, 'color: #00ff9d;', guildsData.guilds.slice(0, 3));
        } catch (err) {
            console.error('%c✗ Servers Fetch Failed', 'color: #ff003c;', err.message);
            console.groupEnd();
            return false;
        }

        console.log('%c□ Checking Elements...', 'color: #00ff9d; font-weight: bold;', {
            main: document.getElementById('grid-container') ? '✓' : '✗',
            selector: document.getElementById('view-selector') ? '✓' : '✗'
        });

        console.log('%c✅ VALIDATION PASSED', 'color: #00ff9d; font-weight: bold; font-size: 14px;');
        console.groupEnd();
        return true;
    },

    checkAccessibility() {
        console.group('%c♿ CHECK', 'color: #9d4edd; font-weight: bold; font-size: 12px;');

        const issues = {
            inputsWithoutLabel: document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length,
            buttonsWithoutLabel: document.querySelectorAll('button:not([aria-label])').length,
            imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length
        };

        console.log('%cIssues Found:', 'color: #ff9d4e; font-weight: bold;', issues);
        console.groupEnd();
        return issues;
    },

    runFullDiagnostics() {
        console.clear();
        console.log('%c\n🔧 VALIDATION\n', 'color: #9d4edd; font-size: 16px; font-weight: bold;');

        this.validateOAuthFlow();
        this.checkAccessibility();

        console.log('%c\n✓ COMPLETE', 'color: #00ff9d; font-weight: bold; font-size: 14px;');
    }
};

if (new URLSearchParams(window.location.search).get('sid')) {
    window.OAUTH_VALIDATOR = OAUTH_VALIDATOR;
}
