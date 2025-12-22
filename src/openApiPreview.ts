import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseOpenApiContent, isValidOpenApiSpec } from './utils';

export class OpenApiPreviewPanel {
    public static readonly viewType = 'scalarOpenApiPreview';
    private static panels: Map<string, OpenApiPreviewPanel> = new Map();

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _fileUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static async createOrShow(extensionUri: vscode.Uri, fileUri: vscode.Uri) {
        const column = vscode.ViewColumn.Beside;
        const key = fileUri.fsPath;

        // If we already have a panel for this file, show it
        if (OpenApiPreviewPanel.panels.has(key)) {
            const existingPanel = OpenApiPreviewPanel.panels.get(key)!;
            existingPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            OpenApiPreviewPanel.viewType,
            `Preview: ${path.basename(fileUri.fsPath)}`,
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        const previewPanel = new OpenApiPreviewPanel(panel, extensionUri, fileUri);
        OpenApiPreviewPanel.panels.set(key, previewPanel);
        await previewPanel._update();
    }

    public static updateIfVisible(fileUri: vscode.Uri) {
        const key = fileUri.fsPath;
        const panel = OpenApiPreviewPanel.panels.get(key);
        if (panel) {
            panel._update();
        }
    }

    public static disposeAll() {
        OpenApiPreviewPanel.panels.forEach(panel => panel.dispose());
        OpenApiPreviewPanel.panels.clear();
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, fileUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._fileUri = fileUri;

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content when the view becomes visible
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        const key = this._fileUri.fsPath;
        OpenApiPreviewPanel.panels.delete(key);

        // Clean up resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async _update() {
        try {
            const content = await fs.promises.readFile(this._fileUri.fsPath, 'utf-8');
            const spec = parseOpenApiContent(content, this._fileUri.fsPath);

            if (!isValidOpenApiSpec(spec)) {
                this._panel.webview.html = this._getErrorHtml('This file does not appear to be a valid OpenAPI specification. Expected "openapi" or "swagger" property.');
                return;
            }

            this._panel.webview.html = this._getHtmlForWebview(spec);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this._panel.webview.html = this._getErrorHtml(`Failed to load OpenAPI specification: ${message}`);
        }
    }

    private _getHtmlForWebview(spec: object): string {
        const config = vscode.workspace.getConfiguration('scalar');
        const theme = config.get<string>('theme', 'auto');
        const showSidebar = config.get<boolean>('showSidebar', true);
        const hideModels = config.get<boolean>('hideModels', false);

        // Determine dark mode based on VS Code theme if set to auto
        let resolvedTheme = theme;
        if (theme === 'auto') {
            const vscodeTheme = vscode.window.activeColorTheme.kind;
            // Dark = 2, HighContrast = 3 (which is dark), Light = 1, HighContrastLight = 4
            const darkMode = vscodeTheme === vscode.ColorThemeKind.Dark || vscodeTheme === vscode.ColorThemeKind.HighContrast;
            resolvedTheme = darkMode ? 'dark' : 'light';
        }

        const scalarConfig = {
            theme: resolvedTheme,
            showSidebar,
            hideModels,
            content: spec
        };

        // Get the URI for the bundled webview script
        const webviewScriptUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'main.js')
        );

        // Get the URI for the bundled CSS
        const webviewCssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'main.css')
        );

        // Generate a nonce for inline scripts
        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._panel.webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com blob:; font-src ${this._panel.webview.cspSource} https://fonts.gstatic.com data: blob:; script-src 'nonce-${nonce}' 'unsafe-eval' blob:; worker-src blob:; connect-src https: http: ws: wss:; img-src ${this._panel.webview.cspSource} https: http: data: blob:;">
    <link rel="stylesheet" href="${webviewCssUri}">
    <title>OpenAPI Preview</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #api-reference {
            min-height: 100%;
            width: 100%;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #666;
        }
        .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-right: 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error-message {
            color: #e74c3c;
            padding: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="api-reference">
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading Scalar API Reference...</span>
        </div>
    </div>
    <script nonce="${nonce}">
        // Inject the Scalar config for the webview bundle to pick up
        window.__SCALAR_CONFIG__ = ${JSON.stringify(scalarConfig)};
    </script>
    <script nonce="${nonce}" src="${webviewScriptUri}"></script>
</body>
</html>`;
    }

    private _getErrorHtml(message: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .error-container {
            text-align: center;
            padding: 40px;
            max-width: 500px;
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .error-message {
            font-size: 14px;
            line-height: 1.5;
            color: var(--vscode-errorForeground, #f44336);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-message">${escapeHtml(message)}</p>
    </div>
</body>
</html>`;
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
