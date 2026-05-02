import {useEffect, useState} from 'react';
import {
	ItemSelector,
	type ItemSelectorOption,
} from '@/components/item-selector';
import {LLMClient} from '@/types/core';

interface ModelSelectorProps {
	client: LLMClient | null;
	currentModel: string;
	onModelSelect: (model: string) => void;
	onCancel: () => void;
}

export default function ModelSelector({
	client,
	currentModel,
	onModelSelect,
	onCancel,
}: ModelSelectorProps) {
	const [models, setModels] = useState<ItemSelectorOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadModels = async () => {
			if (!client) {
				setError('No active client found');
				setLoading(false);
				return;
			}

			try {
				const availableModels = await client.getAvailableModels();

				if (availableModels.length === 0) {
					setError('No models available. Please check your configuration.');
					setLoading(false);
					return;
				}

				setModels(
					availableModels.map(model => ({
						label: `${model}${model === currentModel ? ' (current)' : ''}`,
						value: model,
					})),
				);
				setLoading(false);
			} catch (err) {
				setError(`Error accessing models: ${String(err)}`);
				setLoading(false);
			}
		};

		void loadModels();
	}, [client, currentModel]);

	return (
		<ItemSelector
			title={loading ? 'Model Selection' : 'Select a Model'}
			items={models}
			onSelect={onModelSelect}
			onCancel={onCancel}
			loading={loading}
			loadingMessage="Loading available models..."
			error={error}
			errorTitle="Model Selection - Error"
			errorHint="Make sure your provider is properly configured."
		/>
	);
}
