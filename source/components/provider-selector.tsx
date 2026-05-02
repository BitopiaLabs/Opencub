import {useState} from 'react';
import {
	ItemSelector,
	type ItemSelectorOption,
} from '@/components/item-selector';
import {getAppConfig} from '@/config/index';

interface ProviderSelectorProps {
	currentProvider: string;
	onProviderSelect: (provider: string) => void;
	onCancel: () => void;
}

export default function ProviderSelector({
	currentProvider,
	onProviderSelect,
	onCancel,
}: ProviderSelectorProps) {
	const [providers] = useState<ItemSelectorOption[]>(() => {
		const config = getAppConfig();
		if (!config.providers) return [];
		return config.providers.map(provider => ({
			label: `${provider.name}${
				currentProvider === provider.name ? ' (current)' : ''
			}`,
			value: provider.name,
		}));
	});

	return (
		<ItemSelector
			title="Select a Provider"
			items={providers}
			onSelect={onProviderSelect}
			onCancel={onCancel}
		/>
	);
}
