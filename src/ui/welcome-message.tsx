import fs from 'fs';
import {Box, Text} from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import path from 'path';
import {memo} from 'react';
import {fileURLToPath} from 'url';
import {useResponsiveTerminal} from '@/hooks/useTerminalWidth';
import {useTheme} from '@/hooks/useTheme';
import {getOpenCubShape} from '@/shared/config/preferences';
import type {OpenCubShape} from '@/shared/types/ui';
import {TitledBoxWithPreferences} from '@/ui/primitives/titled-box';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json once at module load time to avoid repeated file reads
const packageJson = JSON.parse(
	fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
) as {version: string};

const DEFAULT_SHAPE: OpenCubShape = 'tiny';

export default memo(function WelcomeMessage() {
	const {boxWidth, isNarrow, isNormal} = useResponsiveTerminal();
	const {colors} = useTheme();

	// Get the user's preferred opencub shape or use default
	const opencubShape = getOpenCubShape() ?? DEFAULT_SHAPE;

	return (
		<>
			{/* Narrow terminal: simple text without boxes */}
			{isNarrow ? (
				<>
					<Gradient colors={[colors.primary, colors.tool]}>
						<BigText text="NC" font={opencubShape} />
					</Gradient>
					<Box
						flexDirection="column"
						marginBottom={1}
						borderStyle="round"
						borderColor={colors.primary}
						paddingY={1}
						paddingX={2}
					>
						<Box marginBottom={1}>
							<Text color={colors.primary} bold>
								OpenCub {packageJson.version}
							</Text>
						</Box>

						<Text color={colors.text}>
							Local-first AI coding in your terminal.
						</Text>
						<Text color={colors.secondary}>
							Ask for analysis, edits, commands, or plans.
						</Text>
						<Text color={colors.secondary}>
							Use /help for commands, /exit to quit.
						</Text>
					</Box>
				</>
			) : (
				/* Normal/Wide terminal: full version with TitledBoxWithPreferences */
				<>
					<Gradient colors={[colors.primary, colors.tool]}>
						<BigText text="OpenCub" font={opencubShape} />
					</Gradient>

					<TitledBoxWithPreferences
						title={`OpenCub ${packageJson.version}`}
						width={boxWidth}
						borderColor={colors.primary}
						paddingX={2}
						paddingY={1}
						flexDirection="column"
						marginBottom={1}
					>
						<Box paddingBottom={1} flexDirection="column">
							<Text color={colors.text} bold>
								Local-first AI coding assistant for your terminal.
							</Text>
							<Text color={colors.secondary}>
								Connect OpenAI, OpenRouter, Ollama, or another provider and ask
								OpenCub to inspect, edit, test, and explain your codebase.
							</Text>
						</Box>

						<Box paddingBottom={1} flexDirection="column">
							<Text color={colors.text}>Try asking:</Text>
							<Text color={colors.secondary}>
								{isNormal
									? '1. Analyze this project and find the highest-risk issues.'
									: '1. Analyze this project and find the highest-risk issues before release.'}
							</Text>
							<Text color={colors.secondary}>
								2. Refactor the auth flow and update the related tests.
							</Text>
							<Text color={colors.secondary}>
								{isNormal
									? '3. Explain how to run and debug this repository.'
									: '3. Explain how to run and debug this repository, including required environment variables.'}
							</Text>
						</Box>

						<Box flexDirection="column">
							<Text color={colors.secondary}>
								Commands: /help for actions, /model to switch model, /mode to
								change approvals, /exit to quit.
							</Text>
							<Text color={colors.secondary}>
								Tip: start with plan mode when you want a review before edits.
							</Text>
						</Box>
					</TitledBoxWithPreferences>
				</>
			)}
		</>
	);
});
