import fs from 'fs/promises';
import {getClosestConfigFile} from '@/shared/config/index';
import {MAX_PROMPT_HISTORY_SIZE} from '@/shared/constants';
import {logError} from '@/shared/utils/message-queue';
import type {InputState} from './types/hooks';

const JSON_FORMAT_MARKER = '---JSON_FORMAT---';

export class PromptHistory {
	private history: InputState[] = [];
	private currentIndex: number = -1;
	private readonly historyFile: string;
	private savePromise: Promise<void> = Promise.resolve();

	constructor(historyFile?: string) {
		this.historyFile = historyFile ?? getClosestConfigFile('.opencub-history');
	}

	async loadHistory(): Promise<void> {
		try {
			const content = await fs.readFile(this.historyFile, 'utf8');
			if (content.startsWith(JSON_FORMAT_MARKER)) {
				const jsonContent = content.slice(JSON_FORMAT_MARKER.length);
				this.history = JSON.parse(jsonContent) as InputState[];
			} else {
				this.history = [];
			}
			this.currentIndex = -1;
		} catch {
			this.history = [];
			this.currentIndex = -1;
		}
	}

	async saveHistory(): Promise<void> {
		// Chain this save onto the previous save to prevent concurrent writes
		this.savePromise = this.savePromise.then(async () => {
			try {
				const jsonContent = JSON.stringify(this.history, null, 2);
				await fs.writeFile(
					this.historyFile,
					JSON_FORMAT_MARKER + jsonContent,
					'utf8',
				);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				logError(`Failed to save prompt history: ${errorMessage}`);
			}
		});
		return this.savePromise;
	}

	addPrompt(inputState: InputState): void;
	addPrompt(prompt: string): void;
	addPrompt(input: InputState | string): void {
		let inputState: InputState;

		if (typeof input === 'string') {
			const trimmed = input.trim();
			if (!trimmed) return;
			inputState = {
				displayValue: trimmed,
				placeholderContent: {},
			};
		} else {
			if (!input.displayValue.trim()) return;
			inputState = input;
		}

		// Remove duplicate if it exists (compare by displayValue)
		const existingIndex = this.history.findIndex(
			entry => entry.displayValue === inputState.displayValue,
		);
		if (existingIndex !== -1) {
			this.history.splice(existingIndex, 1);
		}

		this.history.push(inputState);

		if (this.history.length > MAX_PROMPT_HISTORY_SIZE) {
			this.history = this.history.slice(-MAX_PROMPT_HISTORY_SIZE);
		}

		this.currentIndex = -1;
		void this.saveHistory();
	}

	getPrevious(): InputState | null {
		if (this.history.length === 0) return null;

		if (this.currentIndex === -1) {
			this.currentIndex = this.history.length - 1;
		} else if (this.currentIndex > 0) {
			this.currentIndex--;
		}

		return this.history[this.currentIndex] ?? null;
	}

	getNext(): InputState | null {
		if (this.history.length === 0 || this.currentIndex === -1) return null;

		if (this.currentIndex < this.history.length - 1) {
			this.currentIndex++;
			return this.history[this.currentIndex] ?? null;
		}
		this.currentIndex = -1;
		return null;
	}

	resetIndex(): void {
		this.currentIndex = -1;
	}

	getHistory(): InputState[] {
		return [...this.history];
	}
}

export const promptHistory = new PromptHistory();
