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
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border: 2px solid #047857;
	border-radius: 50px; /* Perfect oval/ellipse shape */
	padding: 12px 20px;
	min-width: 120px;
	min-height: 60px;
	text-align: center;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.terminal-node:hover {
	transform: scale(1.05);
	box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.terminal-node.selected {
	border-color: #ffffff;
	box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4);
	transform: scale(1.05);
}

.node-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
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