<template>
	<div class="flow-link-node" :class="{ 'global-termination': data.terminationType === 'global' }">
		<div class="node-header">
			<v-icon :name="nodeIcon" class="node-icon" />
			<span class="node-label">{{ data.label }}</span>
		</div>
		<div class="node-content">
			<div class="node-description" v-if="data.description">
				{{ data.description }}
			</div>
			
			<!-- Flow link information -->
			<div v-if="data.terminationType === 'phase'" class="flow-link-info">
				<div class="termination-type">
					<v-icon name="link" x-small />
					<span>Phase Transition</span>
				</div>
				<div v-if="data.linkedFlowId" class="linked-flow">
					<v-icon name="play_arrow" x-small />
					<span class="flow-name" @click="handleFlowNavigation">
						{{ data.linkedFlowName || data.linkedFlowId }}
					</span>
				</div>
				<div v-else class="no-link">
					<span class="no-link-text">No flow linked</span>
				</div>
			</div>
			
			<!-- Global termination info -->
			<div v-else-if="data.terminationType === 'global'" class="global-termination-info">
				<div class="termination-type">
					<v-icon name="stop" x-small />
					<span>Global End</span>
				</div>
			</div>
		</div>
		
		<!-- Connection handles -->
		<Handle type="target" :position="Position.Left" id="target-left" class="handle-left target" />
		<Handle type="target" :position="Position.Top" id="target-top" class="handle-top target" />
		<Handle type="target" :position="Position.Bottom" id="target-bottom" class="handle-bottom target" />
		<!-- No source handle for termination nodes -->
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

interface Props {
	data: {
		label: string;
		description?: string;
		terminationType: 'phase' | 'global'; // Type of termination
		linkedFlowId?: string; // ID of the linked flow (for phase transitions)
		linkedFlowName?: string; // Display name of the linked flow
	};
	selected?: boolean;
}

const props = defineProps<Props>();

// Computed icon based on termination type
const nodeIcon = computed(() => {
	return props.data.terminationType === 'global' ? 'stop_circle' : 'arrow_forward_ios';
});

// Handle clicking on linked flow name to navigate
const handleFlowNavigation = () => {
	if (props.data.linkedFlowId) {
		console.log('Navigate to linked flow:', props.data.linkedFlowId);
		// Emit event to parent to handle flow navigation
		// This will be handled by the main module component
		window.dispatchEvent(new CustomEvent('navigate-to-flow', {
			detail: { flowId: props.data.linkedFlowId }
		}));
	}
};
</script>

<style scoped>
.flow-link-node {
	min-width: 160px;
	padding: 12px;
	border-radius: 8px;
	background: var(--theme--background);
	border: 2px solid #8b5cf6; /* Purple for flow links */
	display: flex;
	flex-direction: column;
	gap: 8px;
	position: relative;
}

.flow-link-node.global-termination {
	border-color: #ef4444; /* Red for global termination */
}

.node-header {
	display: flex;
	align-items: center;
	gap: 8px;
}

.node-icon {
	color: #8b5cf6;
	font-size: 16px;
}

.global-termination .node-icon {
	color: #ef4444;
}

.node-label {
	font-weight: 600;
	font-size: 14px;
	color: var(--theme--foreground);
	flex: 1;
}

.node-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.node-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	line-height: 1.4;
}

.flow-link-info,
.global-termination-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 6px 8px;
	border-radius: 4px;
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color-subdued);
}

.termination-type {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	color: var(--theme--foreground-subdued);
	font-weight: 500;
	text-transform: uppercase;
}

.linked-flow {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-top: 2px;
}

.flow-name {
	color: #8b5cf6;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	text-decoration: underline;
	transition: color 0.2s ease;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 120px;
}

.flow-name:hover {
	color: #7c3aed;
}

.no-link {
	margin-top: 2px;
}

.no-link-text {
	font-size: 11px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

/* Connection handles */
.handle-left,
.handle-top,
.handle-bottom {
	width: 12px;
	height: 12px;
	background: #8b5cf6;
	border: 2px solid var(--theme--background);
	border-radius: 50%;
	transition: all 0.2s ease;
	opacity: 0.7;
}

.global-termination .handle-left,
.global-termination .handle-top,
.global-termination .handle-bottom {
	background: #ef4444;
}

.handle-left:hover,
.handle-top:hover,
.handle-bottom:hover {
	opacity: 1;
	transform: scale(1.2);
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
	left: 30%;
	transform: translateX(-50%);
}

.handle-bottom {
	position: absolute;
	bottom: -6px;
	left: 70%;
	transform: translateX(-50%);
}

.flow-link-node.selected {
	border-color: var(--theme--primary);
	box-shadow: 0 0 0 2px var(--theme--primary);
}
</style>
