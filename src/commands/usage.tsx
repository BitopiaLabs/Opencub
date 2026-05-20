/**
 * /usage command
 * Displays token usage statistics
 */

import React from 'react';
import {generateKey} from '@/features/session/key-generator';
import {
	calculateTokenBreakdown,
	calculateToolDefinitionsTokens,
} from '@/features/usage/calculator';
import {getModelContextLimit, getSessionContextLimit} from '@/llm/models/index';
import {getAppConfig} from '@/shared/config/index';
import {loadPreferences} from '@/shared/config/preferences';
import {getToolManager} from '@/shared/message-handler';
import {createTokenizer} from '@/shared/tokenization/index';
import type {Command} from '@/shared/types/commands';
import {getTuneToolMode} from '@/shared/types/config';
import type {Message} from '@/shared/types/core';
import {getLastBuiltPrompt} from '@/shared/utils/prompt-builder';
import {UsageDisplay} from '@/ui/usage/usage-display';

export const usageCommand: Command = {
	name: 'usage',
	description: 'Display token usage statistics',
	handler: async (
		_args: string[],
		messages: Message[],
		metadata: {
			provider: string;
			model: string;
			tokens: number;
			getMessageTokens: (message: Message) => number;
			client?: import('@/shared/types/core').LLMClient | null;
		},
	) => {
		const {provider, model, getMessageTokens, client} = metadata;

		let tokenizer;
		let tokenizerName = 'fallback';

		try {
			// Create tokenizer for accurate breakdown
			tokenizer = createTokenizer(provider, model);
			tokenizerName = tokenizer.getName();
		} catch {
			// Fallback to a simple tokenizer if creation fails
			tokenizer = {
				encode: (text: string) => Math.ceil((text || '').length / 4),
				countTokens: (message: Message) =>
					Math.ceil(
						((message.content || '') + (message.role || '')).length / 4,
					),
				getName: () => 'fallback',
			};
			tokenizerName = 'fallback (error)';
		}

		// Generate the system prompt to include in token calculation
		const toolManager = getToolManager();
		const systemPrompt = getLastBuiltPrompt();

		// Create system message to include in token calculation
		const systemMessage: Message = {
			role: 'system',
			content: systemPrompt,
		};

		// Calculate token breakdown from messages including system prompt
		// Note: We don't use getMessageTokens for the system message since it's freshly generated
		// and won't be in the cache. Instead, we use the tokenizer directly for accurate counting.
		const baseBreakdown = calculateTokenBreakdown(
			[systemMessage, ...messages],
			tokenizer,
			message => {
				try {
					// For system message, always use tokenizer directly to avoid cache misses
					if (message.role === 'system') {
						return tokenizer.countTokens(message);
					}
					// For other messages, use cached token counts
					const tokens = getMessageTokens(message);
					// Ensure we always return a valid number
					return typeof tokens === 'number' && !Number.isNaN(tokens)
						? tokens
						: 0;
				} catch {
					// Fallback to simple estimation if tokenization fails
					return Math.ceil(
						((message.content || '') + (message.role || '')).length / 4,
					);
				}
			},
		);

		// Clean up tokenizer resources
		if (tokenizer.free) {
			tokenizer.free();
		}

		// Calculate tool definitions tokens (only when native tool calling is active)
		// When tools are disabled (XML/JSON fallback), definitions are in the system prompt instead
		const config = getAppConfig();
		const providerConfig = config.providers?.find(p => p.name === provider);
		const prefs = loadPreferences();
		const nativeToolsDisabled =
			providerConfig?.disableTools === true ||
			(providerConfig?.disableToolModels?.includes(model) ?? false) ||
			getTuneToolMode(prefs.tune) !== 'native';

		const toolDefinitions =
			toolManager && !nativeToolsDisabled
				? calculateToolDefinitionsTokens(
						Object.keys(toolManager.getToolRegistry()).length,
					)
				: 0;

		const breakdown = {
			...baseBreakdown,
			toolDefinitions,
			total: baseBreakdown.total + toolDefinitions,
		};

		// Get context limit: session override takes priority
		const sessionLimit = getSessionContextLimit();
		const contextLimit =
			sessionLimit ??
			(await getModelContextLimit(model, {
				providerConfig: client?.getProviderConfig(),
			}));

		return React.createElement(UsageDisplay, {
			key: generateKey('usage'),
			provider,
			model,
			contextLimit,
			currentTokens: breakdown.total,
			breakdown,
			messages,
			tokenizerName,
			getMessageTokens,
		});
	},
};
