<template>
	<div class="layout-options">
		<div class="field">
			<div class="label">Canvas Settings</div>
			<v-checkbox 
				v-model="snapToGrid" 
				label="Snap to Grid"
				@update:model-value="$emit('update:layoutOptions', { ...layoutOptions, snapToGrid })"
			/>
		</div>
		
		<div class="field">
			<div class="label">Grid Size</div>
			<v-input
				v-model="gridSize"
				type="number"
				:min="10"
				:max="50"
				@update:model-value="$emit('update:layoutOptions', { ...layoutOptions, gridSize })"
			/>
		</div>
		
		<div class="field">
			<div class="label">Default Zoom</div>
			<v-slider
				v-model="defaultZoom"
				:min="0.1"
				:max="2"
				:step="0.1"
				@update:model-value="$emit('update:layoutOptions', { ...layoutOptions, defaultZoom })"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
	layoutOptions: Record<string, any>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	'update:layoutOptions': [options: Record<string, any>];
}>();

const snapToGrid = ref(props.layoutOptions?.snapToGrid ?? true);
const gridSize = ref(props.layoutOptions?.gridSize ?? 20);
const defaultZoom = ref(props.layoutOptions?.defaultZoom ?? 1);

watch(() => props.layoutOptions, (newOptions) => {
	snapToGrid.value = newOptions?.snapToGrid ?? true;
	gridSize.value = newOptions?.gridSize ?? 20;
	defaultZoom.value = newOptions?.defaultZoom ?? 1;
}, { deep: true });
</script>

<style scoped>
.layout-options {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.label {
	font-weight: 500;
	color: var(--foreground-normal);
}
</style>
