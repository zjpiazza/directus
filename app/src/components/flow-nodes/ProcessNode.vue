<template>
	<div class="process-node" :class="{ selected: selected }">
		<div class="node-header">
			<v-icon name="settings" class="node-icon" />
			<span class="node-title">{{ data.label || 'Process' }}</span>
		</div>
		<div v-if="data.description" class="node-description">
			{{ data.description }}
		</div>

		<!-- Input Handle -->
		<Handle
			type="target"
			:position="Position.Top"
			:style="{ background: '#555' }"
		/>

		<!-- Output Handle -->
		<Handle
			type="source"
			:position="Position.Bottom"
			:style="{ background: '#555' }"
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
	background: #ffffff;
	border: 2px solid #1a192b;
	border-radius: 8px;
	padding: 12px;
	min-width: 120px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: all 0.2s;
}

.process-node.selected {
	border-color: #6366f1;
	box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.node-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
}

.node-icon {
	color: #6366f1;
	font-size: 16px;
}

.node-title {
	font-weight: 600;
	color: #1a192b;
	font-size: 14px;
}

.node-description {
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
	line-height: 1.3;
}
</style>