import {parseToolArguments} from '@/utils/tool-args-parser';

/**
 * Resolve whether a tool requires approval before execution.
 *
 * The AI SDK's `Tool` type doesn't expose `needsApproval` in its public
 * interface, but our wrappers (built-in tools, MCP tools, agent tools) attach
 * it as either a boolean or a function of the parsed arguments. This helper
 * encapsulates the cast and the resolution logic so call sites don't repeat
 * the same `as unknown as {needsApproval?: ...}` shape three times.
 *
 * Returns `true` when:
 *   - the tool is missing
 *   - `needsApproval` is `true`
 *   - `needsApproval` is a function that returns `true`
 *   - the function throws (fail safe — require approval if we can't decide)
 *
 * Returns `false` only when `needsApproval` is explicitly `false` or a
 * function that returns `false`.
 */
export async function toolNeedsApproval(
	tool: unknown,
	rawArguments: unknown,
): Promise<boolean> {
	if (!tool) return true;

	const needsApprovalProp = (
		tool as {
			needsApproval?: boolean | ((args: unknown) => boolean | Promise<boolean>);
		}
	).needsApproval;

	if (typeof needsApprovalProp === 'boolean') {
		return needsApprovalProp;
	}

	if (typeof needsApprovalProp === 'function') {
		try {
			const parsedArgs = parseToolArguments(rawArguments);
			return await needsApprovalProp(parsedArgs);
		} catch {
			return true;
		}
	}

	return true;
}
