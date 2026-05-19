import type {OpenCubToolExport} from '@/shared/types/core';
import {copyFileTool} from './copy-file';
import {createDirectoryTool} from './create-directory';
import {deleteFileTool} from './delete-file';
import {moveFileTool} from './move-file';

export function getFileOpTools(): OpenCubToolExport[] {
	return [deleteFileTool, moveFileTool, createDirectoryTool, copyFileTool];
}
