import path from 'node:path';
import {runPlainConversation} from '@/features/plain/conversation';
import {initializePlain} from '@/features/plain/initialize';
import {
	color,
	writeBoot,
	writeError,
	writeLine,
	writeStatus,
} from '@/features/plain/writer';
import {appendToolDefinitionsToPrompt} from '@/llm/ai-sdk-client/tools/system-prompt-assembler';
import {getAppConfig} from '@/shared/config/index';
import {loadPreferences, savePreferences} from '@/shared/config/preferences';
import {getTuneToolMode} from '@/shared/types/config';
import type {DevelopmentMode, Message} from '@/shared/types/core';
import {
	buildSystemPrompt,
	setLastBuiltPrompt,
} from '@/shared/utils/prompt-builder';
import {getShutdownManager} from '@/shared/utils/shutdown';

export interface RunPlainShellOptions {
	prompt: string;
	developmentMode: DevelopmentMode;
	cliProvider?: string;
	cliModel?: string;
	trustDirectory: boolean;
}

/**
 * Headless equivalent of `cub run "..."`. Skips Ink entirely:
 * the LLM, tool, MCP, and subagent stacks all initialize without React,
 * and the conversation loop streams to stdout via plain process.stdout.
 *
 * Exit codes:
 *   0  conversation completed naturally
 *   1  initialization or generation error
 *   2  tool approval was required (matches the Ink `run` behavior in
 *      `useNonInteractiveMode`)
 */
export async function runPlainShell(
	options: RunPlainShellOptions,
): Promise<void> {
	const {prompt, developmentMode, cliProvider, cliModel, trustDirectory} =
		options;

	if (!ensureDirectoryTrust(trustDirectory)) {
		await shutdown(1);
		return;
	}

	let init;
	try {
		init = await initializePlain({cliProvider, cliModel});
	} catch (error) {
		writeError(error instanceof Error ? error.message : String(error));
		await shutdown(1);
		return;
	}

	const {client, toolManager, provider, model} = init;
	writeBoot(provider, model, developmentMode);

	const tunePrefs = loadPreferences().tune;
	const tuneToolMode = getTuneToolMode(tunePrefs);
	const toolsDisabled =
		tuneToolMode !== 'native' || isToolCallingDisabled(provider, model);
	const fallbackToolFormat: 'xml' | 'json' =
		tuneToolMode === 'json' ? 'json' : 'xml';
	const availableNames = toolManager.getAvailableToolNames(
		undefined,
		developmentMode,
	);
	const basePrompt = buildSystemPrompt(
		developmentMode,
		undefined,
		availableNames,
		toolsDisabled,
		getAppConfig().systemPrompt,
	);
	const toolsForPrompt = toolsDisabled
		? toolManager.getFilteredToolsWithoutExecute(availableNames)
		: {};
	const systemContent = appendToolDefinitionsToPrompt(
		basePrompt,
		toolsDisabled,
		fallbackToolFormat,
		toolsForPrompt,
	);
	setLastBuiltPrompt(systemContent);

	const systemMessage: Message = {role: 'system', content: systemContent};
	const initialMessages: Message[] = [{role: 'user', content: prompt}];

	const abortController = new AbortController();
	const sigint = () => abortController.abort();
	process.on('SIGINT', sigint);

	const nonInteractiveAlwaysAllow = getAppConfig().alwaysAllow ?? [];

	writeLine();
	const outcome = await runPlainConversation({
		client,
		toolManager,
		systemMessage,
		initialMessages,
		developmentMode,
		nonInteractiveAlwaysAllow,
		abortSignal: abortController.signal,
	});
	process.off('SIGINT', sigint);

	switch (outcome.kind) {
		case 'success':
			await shutdown(0);
			return;
		case 'tool-approval-required':
			writeError(
				`Tool approval required for: ${outcome.toolNames.join(', ')}. ` +
					`Re-run with --mode auto-accept or --mode yolo, or add the tools to ` +
					`agents.config.json "alwaysAllow".`,
			);
			await shutdown(2);
			return;
		case 'error':
			writeError(outcome.message);
			await shutdown(1);
			return;
	}
}

function isToolCallingDisabled(provider: string, model: string): boolean {
	const config = getAppConfig();
	const providerConfig = config.providers?.find(p => p.name === provider);
	if (!providerConfig) return false;
	return providerConfig.disableToolModels?.includes(model) ?? false;
}

function ensureDirectoryTrust(trustDirectoryFlag: boolean): boolean {
	if (trustDirectoryFlag) return true;
	const cwd = path.resolve(process.cwd());
	const preferences = loadPreferences();
	const trusted = (preferences.trustedDirectories ?? []).some(
		dir => path.resolve(dir) === cwd,
	);
	if (trusted) return true;

	if (process.env.OPENCUB_TRUST_DIRECTORY === '1') {
		const updated = preferences.trustedDirectories ?? [];
		updated.push(cwd);
		savePreferences({...preferences, trustedDirectories: updated});
		writeStatus(`Marked ${cwd} as trusted (OPENCUB_TRUST_DIRECTORY=1).`);
		return true;
	}

	writeError(
		`Directory ${cwd} is not trusted. Pass --trust-directory or set ` +
			`OPENCUB_TRUST_DIRECTORY=1 to bypass the disclaimer for this run.`,
	);
	return false;
}

async function shutdown(code: number): Promise<void> {
	if (code === 0) {
		writeLine();
		writeStatus(color('green', 'done'));
	}
	await getShutdownManager().gracefulShutdown(code);
}
