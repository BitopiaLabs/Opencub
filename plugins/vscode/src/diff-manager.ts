import * as vscode from 'vscode';
import * as path from 'path';
import {PendingChange, FileChangeMessage} from './protocol';

// Custom URI scheme for virtual documents (won't trigger linters)
const DIFF_SCHEME = 'opencub-diff';

/**
 * Content provider for virtual diff documents
 * Using virtual documents prevents VS Code from running linters on them
 */
class DiffContentProvider implements vscode.TextDocumentContentProvider {
	private contents: Map<string, string> = new Map();
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	readonly onDidChange = this._onDidChange.event;

	setContent(uri: vscode.Uri, content: string): void {
		this.contents.set(uri.toString(), content);
		this._onDidChange.fire(uri);
	}

	removeContent(uri: vscode.Uri): void {
		this.contents.delete(uri.toString());
	}

	provideTextDocumentContent(uri: vscode.Uri): string {
		return this.contents.get(uri.toString()) || '';
	}

	dispose(): void {
		this.contents.clear();
		this._onDidChange.dispose();
	}
}

/**
 * Manages file diffs and change previews
 */
export class DiffManager {
	private pendingChanges: Map<string, PendingChange> = new Map();
	private openEditors: Map<string, vscode.Uri[]> = new Map();
	private onChangeCallbacks: Set<() => void> = new Set();
	private contentProvider: DiffContentProvider;

	constructor(private context: vscode.ExtensionContext) {
		// Register the virtual document provider
		this.contentProvider = new DiffContentProvider();
		context.subscriptions.push(
			vscode.workspace.registerTextDocumentContentProvider(
				DIFF_SCHEME,
				this.contentProvider,
			),
		);
	}

	/**
	 * Add a new pending file change
	 */
	addPendingChange(message: FileChangeMessage): void {
		const change: PendingChange = {
			id: message.id,
			filePath: message.filePath,
			originalContent: message.originalContent,
			newContent: message.newContent,
			toolName: message.toolName,
			timestamp: Date.now(),
		};

		this.pendingChanges.set(message.id, change);
		this.notifyChanges();
	}

	/**
	 * Get all pending changes
	 */
	getPendingChanges(): PendingChange[] {
		return Array.from(this.pendingChanges.values()).sort(
			(a, b) => a.timestamp - b.timestamp,
		);
	}

	/**
	 * Get a specific pending change
	 */
	getPendingChange(id: string): PendingChange | undefined {
		return this.pendingChanges.get(id);
	}

	/**
	 * Get the newest pending change, used by command-palette approve/reject commands.
	 */
	getLatestPendingChange(): PendingChange | undefined {
		const changes = this.getPendingChanges();
		return changes[changes.length - 1];
	}

	/**
	 * Create a virtual URI for diff content (won't trigger linters)
	 */
	private createVirtualUri(
		id: string,
		type: 'original' | 'modified' | 'new',
		fileName: string,
	): vscode.Uri {
		// Include the file extension in the path for syntax highlighting
		// but use our custom scheme so linters don't run
		return vscode.Uri.parse(`${DIFF_SCHEME}:/${id}/${type}/${fileName}`);
	}

	/**
	 * Show diff preview for a pending change
	 * Uses virtual documents to prevent linters from running
	 * Preserves terminal focus by restoring it after showing the diff
	 */
	async showDiff(id: string): Promise<void> {
		const change = this.pendingChanges.get(id);
		if (!change) {
			vscode.window.showErrorMessage(`Change ${id} not found`);
			return;
		}

		// Remember the active terminal before showing diff
		const activeTerminal = vscode.window.activeTerminal;

		const fileName = path.basename(change.filePath);
		const isNewFile = change.originalContent === '';

		// For new files, show the content directly with syntax highlighting
		if (isNewFile) {
			const modifiedUri = this.createVirtualUri(id, 'new', fileName);

			// Set content in our virtual document provider
			this.contentProvider.setContent(modifiedUri, change.newContent);

			// Track this editor
			this.openEditors.set(id, [modifiedUri]);

			// Open the new file content for preview
			const doc = await vscode.workspace.openTextDocument(modifiedUri);
			await vscode.window.showTextDocument(doc, {
				preview: true,
				preserveFocus: true,
				});

			// Restore terminal focus
			if (activeTerminal) {
				await vscode.commands.executeCommand('workbench.action.terminal.focus');
			}

			return;
		}

		// For existing files, show diff using virtual documents
		const originalUri = this.createVirtualUri(id, 'original', fileName);
		const modifiedUri = this.createVirtualUri(id, 'modified', fileName);

		// Set content in our virtual document provider
		this.contentProvider.setContent(originalUri, change.originalContent);
		this.contentProvider.setContent(modifiedUri, change.newContent);

		// Track these editors
		this.openEditors.set(id, [originalUri, modifiedUri]);

		// Open diff editor with preserveFocus to avoid stealing terminal focus
		const title = `OpenCub: ${fileName} (${change.toolName})`;
		await vscode.commands.executeCommand(
			'vscode.diff',
			originalUri,
			modifiedUri,
			title,
			{preview: true, preserveFocus: true},
		);

		// Restore terminal focus after diff opens
		if (activeTerminal) {
			await vscode.commands.executeCommand('workbench.action.terminal.focus');
		}
	}

	/**
	 * Close diff for a pending change (called when CLI confirms/rejects)
	 */
	async closeDiff(id: string): Promise<void> {
		await this.closeEditors(id);
		this.removePendingChange(id);
	}

	/**
	 * Close diff editors associated with a change
	 */
	private async closeEditors(id: string): Promise<void> {
		const uris = this.openEditors.get(id);
		if (!uris) {
			return;
		}

		// Close all tabs showing these URIs
		const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);

		for (const tab of allTabs) {
			let shouldClose = false;
			const input = tab.input;

			if (input instanceof vscode.TabInputText) {
				// Check if this is one of our virtual documents
				shouldClose = uris.some(uri => uri.toString() === input.uri.toString());
			} else if (input instanceof vscode.TabInputTextDiff) {
				// Check if this is our diff editor
				shouldClose =
					uris.some(uri => uri.toString() === input.original.toString()) ||
					uris.some(uri => uri.toString() === input.modified.toString());
			}

			if (shouldClose) {
				await vscode.window.tabGroups.close(tab);
			}
		}

		// Clean up virtual document content
		for (const uri of uris) {
			this.contentProvider.removeContent(uri);
		}

		this.openEditors.delete(id);
	}

	/**
	 * Resolve a pending change after the CLI accepts or rejects it.
	 * The CLI remains the source of truth for executing file edits.
	 */
	async resolveChange(id: string): Promise<boolean> {
		const change = this.pendingChanges.get(id);
		if (!change) {
			return false;
		}

		// Close diff editors first
		await this.closeEditors(id);

		this.removePendingChange(id);
		return true;
	}

	/**
	 * Remove a pending change from tracking
	 * Note: Virtual document cleanup is handled in closeEditors()
	 */
	private removePendingChange(id: string): void {
		if (this.pendingChanges.has(id)) {
			this.pendingChanges.delete(id);
			this.notifyChanges();
		}
	}

	/**
	 * Resolve all pending changes.
	 */
	resolveAll(): void {
		const ids = Array.from(this.pendingChanges.keys());
		for (const id of ids) {
			void this.resolveChange(id);
		}
	}

	/**
	 * Subscribe to changes in pending changes list
	 */
	onChanges(callback: () => void): vscode.Disposable {
		this.onChangeCallbacks.add(callback);
		return new vscode.Disposable(() => {
			this.onChangeCallbacks.delete(callback);
		});
	}

	private notifyChanges(): void {
		this.onChangeCallbacks.forEach(callback => callback());
	}

	/**
	 * Cleanup virtual document provider
	 */
	dispose(): void {
		this.contentProvider.dispose();
	}
}
