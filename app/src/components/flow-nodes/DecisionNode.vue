<template>
	<div class="decision-node" :class="{ selected: selected }">
		<div class="diamond-shape">
			<div class="node-content">
				<v-icon name="change_history" class="node-icon" />
				<span class="node-title">{{ data.label || 'Decision' }}</span>
				<div v-if="data.description" class="node-description">
					{{ data.description }}
				</div>
			</div>
		</div>

		<!-- Input Handle -->
		<Handle
			type="target"
			:position="Position.Top"
			:style="{ background: '#f59e0b' }"
		/>

		<!-- Output Handles for Yes/No -->
		<Handle
			id="yes"
			type="source"
			:position="Position.Right"
			:style="{ background: '#10b981', top: '40%' }"
		/>

		<Handle
			id="no"
			type="source"
			:position="Position.Left"
			:style="{ background: '#ef4444', top: '40%' }"
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
.decision-node {
	position: relative;
	width: 120px;
	height: 120px;
}

.diamond-shape {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	border: 2px solid #b91c1c;
	transform: rotate(45deg);
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.diamond-shape:hover {
	transform: rotate(45deg) scale(1.05);
	box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

.decision-node.selected .diamond-shape {
	border-color: #ffffff;
	box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4);
	transform: rotate(45deg) scale(1.05);
}

.node-content {
	transform: rotate(-45deg);
	text-align: center;
	color: white;
	padding: 8px;
	max-width: 80px;
}

.node-icon {
	font-size: 16px;
	display: block;
	margin-bottom: 4px;
}

.node-title {
	font-weight: 600;
	font-size: 12px;
	display: block;
	line-height: 1.2;
}

.node-description {
	font-size: 10px;
	opacity: 0.9;
	margin-top: 2px;
	line-height: 1.2;
}
</style>