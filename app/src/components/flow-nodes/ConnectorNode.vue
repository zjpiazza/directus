<template>
	<div class="connector-node" :class="{ selected: selected }">
		<div class="circle-shape">
			<v-icon name="circle" class="node-icon" />
		</div>

		<!-- Input Handle -->
		<Handle
			type="target"
			:position="Position.Top"
			:style="{ background: '#6b7280' }"
		/>

		<!-- Output Handle -->
		<Handle
			type="source"
			:position="Position.Bottom"
			:style="{ background: '#6b7280' }"
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
.connector-node {
	position: relative;
	width: 40px;
	height: 40px;
}

.circle-shape {
	width: 100%;
	height: 100%;
	background: #6b7280;
	border: 2px solid #4b5563;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: all 0.2s;
}

.connector-node.selected .circle-shape {
	border-color: #6366f1;
	background: #6366f1;
	box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
	transform: scale(1.1);
}

.node-icon {
	color: white;
	font-size: 16px;
}
</style>