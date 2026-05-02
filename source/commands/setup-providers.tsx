import {Text} from 'ink';
import React from 'react';
import {Command} from '@/types/index';

/**
 * `/setup-providers` is a "special command": registered here for slash-menu
 * discovery and `/help` text, but actually dispatched in
 * `source/app/utils/app-util.ts` (see `SPECIAL_COMMANDS.SETUP_PROVIDERS`),
 * which calls `onEnterConfigWizardMode()` to swap the chat UI for the wizard.
 *
 * The handler is unreachable; it returns an empty Text so the Command type's
 * required handler shape is satisfied.
 */
export const setupProvidersCommand: Command = {
	name: 'setup-providers',
	description: 'Launch interactive configuration wizard',
	handler: () => Promise.resolve(React.createElement(Text, {}, '')),
};
