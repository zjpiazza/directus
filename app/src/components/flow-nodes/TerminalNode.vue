<template>
	<div class="terminal-node" :class="{ selected: selected }">
		<div class="node-header">
			<v-icon name="radio_button_checked" class="node-icon" />
			<span class="node-title">{{ data.label || 'Terminal' }}</span>
		</div>
		<div v-if="data.description" class="node-description">
			{{ data.description }}
		</div>

		<!-- Only output handle for start nodes, only input for end nodes -->
		<Handle
			v-if="data.terminalType !== 'end'"
			type="source"
			:position="Position.Bottom"
			:style="{ background: '#10b981' }"
		/>

		<Handle
			v-if="data.terminalType !== 'start'"
			type="target"
			:position="Position.Top"
			:style="{ background: '#ef4444' }"
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
		terminalType?: 'start' | 'end';
	};
	selected?: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.terminal-node {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: 2px solid #4c1d95;
	border-radius: 50px;
	padding: 12px 16px;
	min-width: 100px;
	text-align: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	transition: all 0.2s;
}

.terminal-node.selected {
	border-color: #fbbf24;
	box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
	transform: scale(1.05);
}

.node-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
}

.node-icon {
	color: #fbbf24;
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