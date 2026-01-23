/**
 * Client Authentication via URL Parameter + sessionStorage
 *
 * Usage: Visit any page with ?client=unico to unlock UNICO-specific content
 * The authentication persists for the browser session (until tab closes)
 */

(function() {
    'use strict';

    const CLIENT_KEY = 'fse_client';
    const VALID_CLIENTS = ['unico'];

    // Check URL parameter on page load
    function checkUrlParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientParam = urlParams.get('client');

        if (clientParam && VALID_CLIENTS.includes(clientParam.toLowerCase())) {
            sessionStorage.setItem(CLIENT_KEY, clientParam.toLowerCase());

            // Clean up URL (remove ?client=xxx) for cleaner navigation
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    // Get authenticated client (if any)
    function getAuthenticatedClient() {
        return sessionStorage.getItem(CLIENT_KEY);
    }

    // Show/hide client-specific nav links
    function updateNavigation() {
        const client = getAuthenticatedClient();
        const unicoLinks = document.querySelectorAll('a[href="unico.html"]');

        unicoLinks.forEach(link => {
            if (client === 'unico') {
                link.style.display = '';
            } else {
                link.style.display = 'none';
            }
        });
    }

    // Initialize on DOM ready
    function init() {
        checkUrlParam();
        updateNavigation();
    }

    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging if needed
    window.FSE_ClientAuth = {
        getClient: getAuthenticatedClient,
        isUnico: function() { return getAuthenticatedClient() === 'unico'; }
    };
})();
