<template>
	<div class="terminal-node">
		<div class="node-header">
			<v-icon name="radio_button_checked" class="node-icon" />
			<span class="node-label">{{ data.label }}</span>
		</div>
		<div class="node-content">
			<div class="node-description" v-if="data.description">
				{{ data.description }}
			</div>
		</div>
		<!-- Connection handles -->
		<Handle type="source" :position="Position.Right" id="source-right" class="handle-right source" />
		<Handle type="target" :position="Position.Left" id="target-left" class="handle-left target" />
		<Handle type="target" :position="Position.Top" id="target-top" class="handle-top target" />
		<Handle type="target" :position="Position.Bottom" id="target-bottom" class="handle-bottom target" />
	</div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
	data: {
		label: string;
		description?: string;
	};
	selected?: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.terminal-node {
	min-width: 120px;
	padding: 12px;
	border-radius: 8px;
	background: var(--theme--background);
	border: 2px solid #10b981;
	display: flex;
	flex-direction: column;
	gap: 8px;
	position: relative;
}

.node-header {
	display: flex;
	align-items: center;
	gap: 8px;
}

.node-icon {
	color: #10b981;
	font-size: 16px;
}

.node-label {
	font-weight: 600;
	font-size: 14px;
	color: var(--theme--foreground);
	flex: 1;
}

.node-content {
	flex: 1;
}

.node-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	line-height: 1.4;
}

.handle-right,
.handle-left {
	width: 12px;
	height: 12px;
	background: #10b981;
	border: 2px solid var(--theme--background);
	border-radius: 50%;
	transition: all 0.2s ease;
	opacity: 0.7;
}

.handle-right:hover,
.handle-left:hover,
.handle-top:hover,
.handle-bottom:hover {
	opacity: 1;
	transform: scale(1.2);
	background: #059669;
}

.handle-right {
	position: absolute;
	top: 50%;
	right: -6px;
	transform: translateY(-50%);
}

.handle-left {
	position: absolute;
	top: 50%;
	left: -6px;
	transform: translateY(-50%);
}

.handle-top {
	position: absolute;
	top: -6px;
	left: 50%;
	transform: translateX(-50%);
	background: #059669;
	border-color: #047857;
}

.handle-bottom {
	position: absolute;
	bottom: -6px;
	left: 50%;
	transform: translateX(-50%);
	background: #059669;
	border-color: #047857;
}

.terminal-node.selected {
	border-color: var(--theme--primary);
	box-shadow: 0 0 0 2px var(--theme--primary);
}
</style>
