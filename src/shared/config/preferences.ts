import {readFileSync, writeFileSync} from 'fs';
import {getClosestConfigFile} from '@/shared/config/index';
import type {TuneConfig} from '@/shared/types/config';
import type {UserPreferences} from '@/shared/types/index';
import type {OpenCubShape, ThemePreset} from '@/shared/types/ui';
import {logError} from '@/shared/utils/message-queue';
import type {TitleShape} from '@/ui/primitives/styled-title';

let PREFERENCES_PATH: string | null = null;
let CACHED_CONFIG_DIR: string | undefined = undefined;

function getPreferencesPath(): string {
	// Re-compute path if OPENCUB_CONFIG_DIR has changed (important for tests)
	const currentConfigDir = process.env.OPENCUB_CONFIG_DIR;
	if (!PREFERENCES_PATH || CACHED_CONFIG_DIR !== currentConfigDir) {
		PREFERENCES_PATH = getClosestConfigFile('opencub-preferences.json');
		CACHED_CONFIG_DIR = currentConfigDir;
	}
	return PREFERENCES_PATH;
}

// Export for testing purposes - allows tests to reset the cache
export function resetPreferencesCache(): void {
	PREFERENCES_PATH = null;
	CACHED_CONFIG_DIR = undefined;
}

export function loadPreferences(): UserPreferences {
	try {
		const data = readFileSync(getPreferencesPath(), 'utf-8');
		return JSON.parse(data) as UserPreferences;
	} catch (error) {
		logError(`Failed to load preferences: ${String(error)}`);
	}
	return {};
}

export function savePreferences(preferences: UserPreferences): void {
	try {
		writeFileSync(getPreferencesPath(), JSON.stringify(preferences, null, 2));
	} catch (error) {
		logError(`Failed to save preferences: ${String(error)}`);
	}
}

export function updateLastUsed(provider: string, model: string): void {
	const preferences = loadPreferences();
	preferences.lastProvider = provider;
	preferences.lastModel = model;

	// Also save the model for this specific provider
	if (!preferences.providerModels) {
		preferences.providerModels = {};
	}
	preferences.providerModels[provider] = model;

	savePreferences(preferences);
}

export function updateTitleShape(shape: string): void {
	const preferences = loadPreferences();
	preferences.titleShape = shape as TitleShape;
	savePreferences(preferences);
}

export function getTitleShape(): TitleShape | undefined {
	const preferences = loadPreferences();
	return preferences.titleShape;
}

export function updateSelectedTheme(theme: string): void {
	const preferences = loadPreferences();
	preferences.selectedTheme = theme as ThemePreset;
	savePreferences(preferences);
}

export function getLastUsedModel(provider: string): string | undefined {
	const preferences = loadPreferences();
	return preferences.providerModels?.[provider];
}

export function updateOpenCubShape(shape: OpenCubShape): void {
	const preferences = loadPreferences();
	preferences.opencubShape = shape;
	savePreferences(preferences);
}

export function getOpenCubShape(): OpenCubShape | undefined {
	const preferences = loadPreferences();
	return preferences.opencubShape;
}

export function saveTune(config: TuneConfig): void {
	const preferences = loadPreferences();
	preferences.tune = config;
	savePreferences(preferences);
}

/**
 * Get the notifications config from the preferences file.
 */
export function getNotificationsPreference():
	| import('@/shared/types/config').NotificationsConfig
	| undefined {
	const preferences = loadPreferences();
	return preferences.notifications;
}

/**
 * Save the notifications config to the preferences file.
 */
export function updateNotificationsPreference(
	config: import('@/shared/types/config').NotificationsConfig,
): void {
	const preferences = loadPreferences();
	preferences.notifications = config;
	savePreferences(preferences);
}

/**
 * Get the paste threshold from the preferences file.
 */
export function getPasteThreshold(): number | undefined {
	const preferences = loadPreferences();
	const threshold = preferences.paste?.singleLineThreshold;
	if (typeof threshold === 'number' && threshold > 0) {
		return Math.round(threshold);
	}
	return undefined;
}

/**
 * Save the paste threshold to the preferences file.
 */
export function updatePasteThreshold(threshold: number): void {
	const preferences = loadPreferences();
	if (!preferences.paste) {
		preferences.paste = {singleLineThreshold: Math.round(threshold)};
	} else {
		preferences.paste.singleLineThreshold = Math.round(threshold);
	}
	savePreferences(preferences);
}

/**
 * Get the reasoning expanded preference from preferences or environment
 */
export function getReasoningExpanded(): boolean {
	const preferences = loadPreferences();
	return preferences.reasoningExpanded ?? false;
}

/**
 * Save the reasoning expanded preference
 */
export function updateReasoningExpanded(value: boolean): void {
	const preferences = loadPreferences();
	preferences.reasoningExpanded = value;
	savePreferences(preferences);
}

/**
 * Get the compact tool display preference from preferences or environment
 */
export function getCompactToolDisplay(): boolean {
	const preferences = loadPreferences();
	return preferences.compactToolDisplay ?? true;
}

/**
 * Save the compact tool display preference
 */
export function updateCompactToolDisplay(value: boolean): void {
	const preferences = loadPreferences();
	preferences.compactToolDisplay = value;
	savePreferences(preferences);
}
