<template>
	<div class="layout-actions">
		<v-button
			v-if="hasChanges"
			@click="saveFlow"
			:loading="saving"
			:disabled="readonly"
		>
			<v-icon name="save" left />
			Save Flow
		</v-button>
		
		<v-button
			@click="exportFlow"
			secondary
			:disabled="!hasFlowData"
		>
			<v-icon name="download" left />
			Export
		</v-button>
		
		<v-button
			@click="validateFlow"
			secondary
			:disabled="!hasFlowData"
		>
			<v-icon name="check_circle" left />
			Validate
		</v-button>
		
		<v-button
			v-if="hasFlowData"
			@click="clearCanvas"
			secondary
			:disabled="readonly"
		>
			<v-icon name="clear" left />
			Clear
		</v-button>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStores } from '@directus/extensions-sdk';

interface Props {
	hasChanges?: boolean;
	hasFlowData?: boolean;
	readonly?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	'save-flow': [];
	'export-flow': [];
	'validate-flow': [];
	'clear-canvas': [];
}>();

const { useNotificationsStore } = useStores();
const { add: notify } = useNotificationsStore();

const saving = ref(false);

const saveFlow = async () => {
	saving.value = true;
	try {
		emit('save-flow');
		notify({
			type: 'success',
			title: 'Flow saved successfully'
		});
	} catch (error) {
		notify({
			type: 'error',
			title: 'Failed to save flow'
		});
	} finally {
		saving.value = false;
	}
};

const exportFlow = () => {
	emit('export-flow');
};

const validateFlow = () => {
	emit('validate-flow');
};

const clearCanvas = () => {
	if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
		emit('clear-canvas');
	}
};
</script>

<style scoped>
.layout-actions {
	display: flex;
	gap: 8px;
	align-items: center;
}
</style>
