import {isOpenCubToolAlwaysAllowed} from '@/shared/config/opencub-tools-config';
import {getCurrentMode} from '@/shared/context/mode-context';

/**
 * Creates a needsApproval function for file-mutation tools.
 * Returns false if the tool is always-allowed or the current mode is auto-accept/yolo/scheduler.
 */
export function createFileToolApproval(toolName: string): () => boolean {
	return () => {
		if (isOpenCubToolAlwaysAllowed(toolName)) return false;
		const mode = getCurrentMode();
		return mode !== 'auto-accept' && mode !== 'yolo' && mode !== 'scheduler';
	};
}
