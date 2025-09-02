<template>
	<div class="process-node" :class="{ selected: selected }">
		<div class="node-header">
			<v-icon name="crop_square" class="node-icon" />
			<span class="node-title">{{ data.label || 'Process' }}</span>
		</div>
		<div v-if="data.description" class="node-description">
			{{ data.description }}
		</div>

		<!-- Handles on all sides - all same type for maximum flexibility -->
		<Handle
			id="top"
			type="source"
			:position="Position.Top"
			:style="{ background: '#3b82f6' }"
		/>
		<Handle
			id="right"
			type="source"
			:position="Position.Right"
			:style="{ background: '#3b82f6' }"
		/>
		<Handle
			id="bottom"
			type="source"
			:position="Position.Bottom"
			:style="{ background: '#3b82f6' }"
		/>
		<Handle
			id="left"
			type="source"
			:position="Position.Left"
			:style="{ background: '#3b82f6' }"
		/>
	</div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
	id: string;
	data: {
		label?: string;
		description?: string;
	};
	selected?: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.process-node {
	background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
	color: white;
	border: 2px solid #1e3a8a;
	border-radius: 6px; /* Sharp rectangle shape */
	padding: 12px 16px;
	min-width: 120px;
	min-height: 60px;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
	transition: all 0.2s ease;
	cursor: pointer;
}

.process-node:hover {
	transform: scale(1.05);
	box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.process-node.selected {
	border-color: #ffffff;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}

.node-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
}

.node-icon {
	font-size: 16px;
}

.node-title {
	font-weight: 600;
	font-size: 14px;
}

.node-description {
	font-size: 12px;
	opacity: 0.9;
	margin-top: 4px;
	line-height: 1.3;
}
</style>