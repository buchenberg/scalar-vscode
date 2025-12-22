import * as vscode from 'vscode';
import { OpenApiPreviewPanel } from './openApiPreview';

export function activate(context: vscode.ExtensionContext) {
    console.log('Scalar OpenAPI Preview extension is now active');

    // Register the preview command
    const openPreviewCommand = vscode.commands.registerCommand(
        'scalar.openPreview',
        async (uri?: vscode.Uri) => {
            // Get the file URI - either from the command argument or the active editor
            let fileUri = uri;

            if (!fileUri && vscode.window.activeTextEditor) {
                fileUri = vscode.window.activeTextEditor.document.uri;
            }

            if (!fileUri) {
                vscode.window.showErrorMessage('No file selected. Please open an OpenAPI file first.');
                return;
            }

            // Check if it's a supported file type
            const filePath = fileUri.fsPath.toLowerCase();
            if (!filePath.endsWith('.json') && !filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) {
                vscode.window.showErrorMessage('Please select a JSON or YAML file.');
                return;
            }

            try {
                await OpenApiPreviewPanel.createOrShow(context.extensionUri, fileUri);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                vscode.window.showErrorMessage(`Failed to open preview: ${message}`);
            }
        }
    );

    context.subscriptions.push(openPreviewCommand);

    // Watch for file saves to update the preview
    const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const filePath = document.uri.fsPath.toLowerCase();
        if (filePath.endsWith('.json') || filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
            // Update any open preview panels for this file
            OpenApiPreviewPanel.updateIfVisible(document.uri);
        }
    });

    context.subscriptions.push(onSaveDisposable);
}

export function deactivate() {
    OpenApiPreviewPanel.disposeAll();
}
