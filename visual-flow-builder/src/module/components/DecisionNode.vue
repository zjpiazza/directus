<template>
	<div class="decision-node">
		<div class="node-header">
			<v-icon name="help" class="node-icon" />
			<span class="node-label">{{ data.label }}</span>
		</div>
		<div class="node-content">
			<div class="node-description" v-if="data.description">
				{{ data.description }}
			</div>
		</div>
		<!-- Connection handles -->
		<Handle type="target" :position="Position.Top" id="target-top" class="handle-top target" />
		<Handle type="source" :position="Position.Right" id="source-right" class="handle-right source" />
		<Handle type="source" :position="Position.Left" id="source-left" class="handle-left source" />
		<Handle type="target" :position="Position.Bottom" id="target-bottom" class="handle-bottom target" />
		<div class="handle-labels">
			<span class="label-yes">Yes</span>
			<span class="label-no">No</span>
		</div>
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
.decision-node {
	min-width: 140px;
	padding: 12px;
	border-radius: 8px;
	background: var(--theme--background);
	border: 2px solid #f59e0b;
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
	color: #f59e0b;
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

.handle-top,
.handle-right,
.handle-bottom,
.handle-left {
	width: 12px;
	height: 12px;
	background: #f59e0b;
	border: 2px solid var(--theme--background);
	border-radius: 50%;
	transition: all 0.2s ease;
	opacity: 0.7;
}

.handle-top:hover,
.handle-right:hover,
.handle-bottom:hover,
.handle-left:hover {
	opacity: 1;
	transform: scale(1.2);
	background: #d97706;
}

.handle-top {
	position: absolute;
	top: -6px;
	left: 50%;
	transform: translateX(-50%);
}

.handle-bottom {
	position: absolute;
	bottom: -6px;
	left: 50%;
	transform: translateX(-50%);
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

.handle-top.source,
.handle-right.source,
.handle-bottom.source,
.handle-left.source {
	background: #f59e0b;
	border-color: #d97706;
}

.handle-labels {
	position: absolute;
	bottom: -20px;
	left: 0;
	right: 0;
	display: flex;
	justify-content: space-between;
	font-size: 10px;
	color: var(--theme--foreground-subdued);
}

.label-yes {
	margin-left: 12px;
}

.label-no {
	margin-right: 12px;
}

.decision-node.selected {
	border-color: var(--theme--primary);
	box-shadow: 0 0 0 2px var(--theme--primary);
}
</style>
