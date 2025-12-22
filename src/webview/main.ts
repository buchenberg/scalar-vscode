import { createApiReference } from '@scalar/api-reference';

// This runs in the webview context
declare const acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };
declare const __SCALAR_CONFIG__: {
    content: object;
    theme: 'default' | 'alternate' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'deepSpace' | 'saturn' | 'kepler' | 'elysiajs' | 'fastify' | 'mars' | 'laserwave' | 'none' | undefined;
    showSidebar: boolean;
    hideModels: boolean;
};

// Get VS Code API for potential future messaging
const vscode = acquireVsCodeApi();

// Get the config injected by the extension
const config = __SCALAR_CONFIG__;

function initScalar() {
    console.log('Initializing Scalar with config:', config);

    const container = document.getElementById('api-reference');
    if (!container) {
        console.error('Container #api-reference not found');
        return;
    }

    try {
        // Clear loading indicator
        container.innerHTML = '';

        // Create the API reference
        createApiReference(container, {
            content: config.content,
            theme: config.theme,
            showSidebar: config.showSidebar,
            hideModels: config.hideModels,
        });

        console.log('Scalar initialized successfully');
    } catch (err) {
        console.error('Error initializing Scalar:', err);
        container.innerHTML = `<div class="error-message">Error: ${err instanceof Error ? err.message : 'Unknown error'}</div>`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScalar);
} else {
    initScalar();
}
