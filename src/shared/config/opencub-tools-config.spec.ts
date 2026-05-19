import test from 'ava';
import {existsSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {clearAppConfig} from '@/shared/config/index';
import {isOpenCubToolAlwaysAllowed} from '@/shared/config/opencub-tools-config';

const testConfigDir = join(process.cwd(), '.test-config-opencub-tools');
const testConfigPath = join(testConfigDir, 'agents.config.json');

function setupConfig(config: Record<string, unknown>) {
	if (!existsSync(testConfigDir)) {
		mkdirSync(testConfigDir, {recursive: true});
	}
	writeFileSync(testConfigPath, JSON.stringify(config));
}

function cleanupConfig() {
	if (existsSync(testConfigDir)) {
		rmSync(testConfigDir, {recursive: true});
	}
}

// Save and restore cwd for tests that change it
const originalCwd = process.cwd();

test.afterEach(() => {
	process.chdir(originalCwd);
	clearAppConfig();
	cleanupConfig();
});

test.serial(
	'isOpenCubToolAlwaysAllowed returns true for tool in top-level alwaysAllow',
	t => {
		setupConfig({
			opencub: {
				alwaysAllow: ['execute_bash', 'read_file'],
			},
		});
		process.chdir(testConfigDir);
		clearAppConfig();

		t.true(isOpenCubToolAlwaysAllowed('execute_bash'));
		t.true(isOpenCubToolAlwaysAllowed('read_file'));
		t.false(isOpenCubToolAlwaysAllowed('write_file'));
	},
);

test.serial(
	'isOpenCubToolAlwaysAllowed ignores removed opencubTools.alwaysAllow path',
	t => {
		setupConfig({
			opencub: {
				opencubTools: {
					alwaysAllow: ['execute_bash'],
				},
			},
		});
		process.chdir(testConfigDir);
		clearAppConfig();

		t.false(isOpenCubToolAlwaysAllowed('execute_bash'));
	},
);

test.serial(
	'isOpenCubToolAlwaysAllowed returns false when no config exists',
	t => {
		clearAppConfig();

		t.false(isOpenCubToolAlwaysAllowed('execute_bash'));
	},
);

test.serial(
	'isOpenCubToolAlwaysAllowed returns false when alwaysAllow is not an array',
	t => {
		setupConfig({
			opencub: {
				alwaysAllow: 'execute_bash',
			},
		});
		process.chdir(testConfigDir);
		clearAppConfig();

		t.false(isOpenCubToolAlwaysAllowed('execute_bash'));
	},
);
