import type {Colors as FullColors} from '@/shared/types/ui';

// Subset of Colors used by the markdown parser
export type Colors = Pick<
	FullColors,
	| 'primary'
	| 'secondary'
	| 'success'
	| 'error'
	| 'warning'
	| 'info'
	| 'text'
	| 'tool'
>;
