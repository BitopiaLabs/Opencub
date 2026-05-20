import {lazyCommands} from '@/commands/lazy-registry';
import {commandRegistry} from '@/commands/registry';
import {CustomCommandLoader} from '@/features/custom-commands/loader';
import {writeStatus} from '@/features/plain/writer';
import {SubagentExecutor} from '@/features/subagents/subagent-executor';
import {getSubagentLoader} from '@/features/subagents/subagent-loader';
import {ConfigurationError, createLLMClient} from '@/llm/client-factory';
import {getAppConfig} from '@/shared/config/index';
import {
	getLastUsedModel,
	loadPreferences,
	updateLastUsed,
} from '@/shared/config/preferences';
import {validateProjectConfigSecurity} from '@/shared/config/validation';
import {
	setToolManagerGetter,
	setToolRegistryGetter,
} from '@/shared/message-handler';
import type {LLMClient, MCPInitResult} from '@/shared/types/index';
import {setAvailableSubagents} from '@/shared/utils/prompt-processor';
import {setAgentToolExecutor, setAvailableAgentNames} from '@/tools/agent-tool';
import {clearAllTasks} from '@/tools/tasks';
import {ToolManager} from '@/tools/tool-manager';

export interface PlainInitResult {
	client: LLMClient;
	toolManager: ToolManager;
	customCommandLoader: CustomCommandLoader;
	provider: string;
	model: string;
}

export interface PlainInitOptions {
	cliProvider?: string;
	cliModel?: string;
}

/**
 * Framework-agnostic equivalent of useAppInitialization for the plain
 * non-interactive runtime. Replaces React state setters with stderr status
 * lines and throws on configuration failures (no interactive recovery
 * surface in plain mode).
 */
export async function initializePlain(
	options: PlainInitOptions = {},
): Promise<PlainInitResult> {
	void clearAllTasks();

	const toolManager = new ToolManager();
	const customCommandLoader = new CustomCommandLoader();
	const preferences = loadPreferences();

	setToolRegistryGetter(() => toolManager.getToolRegistry());
	setToolManagerGetter(() => toolManager);
	commandRegistry.registerLazy(lazyCommands);

	const preferredProvider = options.cliProvider || preferences.lastProvider;
	const preferredModel = options.cliModel;

	let client: LLMClient;
	let actualProvider: string;
	try {
		const result = await createLLMClient(preferredProvider, preferredModel);
		client = result.client;
		actualProvider = result.actualProvider;
	} catch (error) {
		if (error instanceof ConfigurationError) {
			throw new Error(
				error.isEmptyConfig || error.message.includes('No providers configured')
					? 'No providers configured. Run opencub interactively to set them up.'
					: error.message,
			);
		}
		throw new Error(`Failed to initialize provider: ${String(error)}`);
	}

	let finalModel: string;
	if (preferredModel) {
		finalModel = client.getCurrentModel();
	} else {
		const lastUsedModel = getLastUsedModel(actualProvider);
		if (lastUsedModel) {
			const availableModels = await client.getAvailableModels();
			if (availableModels.includes(lastUsedModel)) {
				client.setModel(lastUsedModel);
				finalModel = lastUsedModel;
			} else {
				finalModel = client.getCurrentModel();
			}
		} else {
			finalModel = client.getCurrentModel();
		}
	}

	updateLastUsed(actualProvider, finalModel);

	const subagentExecutor = new SubagentExecutor(toolManager, client);
	setAgentToolExecutor(subagentExecutor);

	const subagentLoader = getSubagentLoader();
	await subagentLoader.initialize();
	const availableAgents = await subagentLoader.listSubagents();
	const agentSummaries = availableAgents.map(a => ({
		name: a.name,
		description: a.description,
	}));
	setAvailableSubagents(agentSummaries);
	setAvailableAgentNames(agentSummaries);

	try {
		customCommandLoader.loadCommands();
	} catch (error) {
		writeStatus(`Failed to load custom commands: ${String(error)}`);
	}

	await initializeMCP(toolManager);

	return {
		client,
		toolManager,
		customCommandLoader,
		provider: actualProvider,
		model: finalModel,
	};
}

async function initializeMCP(toolManager: ToolManager): Promise<void> {
	const config = getAppConfig();
	if (!config.mcpServers || config.mcpServers.length === 0) return;

	validateProjectConfigSecurity(config.mcpServers);

	const onProgress = (result: MCPInitResult) => {
		if (result.success) {
			writeStatus(`MCP server connected: ${result.serverName}`);
		} else {
			writeStatus(`MCP server failed: ${result.serverName} (${result.error})`);
		}
	};

	try {
		await toolManager.initializeMCP(config.mcpServers, onProgress);
	} catch (error) {
		writeStatus(`MCP initialization error: ${String(error)}`);
	}
}
