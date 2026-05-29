#!/usr/bin/env node
// Cross-platform post-build steps. Replaces the Unix-only
// `cp ... && chmod +x ...` tail of the build script so `pnpm run build`
// works on Windows (cmd.exe), macOS, and Linux alike.
import {chmodSync, copyFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const copies = [
	['src/commands/contributors.json', 'dist/commands/contributors.json'],
];

for (const [src, dest] of copies) {
	mkdirSync(dirname(dest), {recursive: true});
	copyFileSync(src, dest);
}

// Mark the CLI entry executable. No-op on platforms without POSIX
// permission bits (Windows), where chmod has no effect and may throw.
try {
	chmodSync('dist/cli.js', 0o755);
} catch {
	// Intentionally ignored: non-POSIX filesystems don't support the exec bit.
}
