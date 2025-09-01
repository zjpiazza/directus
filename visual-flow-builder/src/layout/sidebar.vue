<template>
	<div class="layout-sidebar">
		<div class="sidebar-section">
			<div class="section-title">Node Palette</div>
			<div class="node-palette">
				<div
					v-for="nodeType in nodeTypes"
					:key="nodeType.type"
					:draggable="!readonly"
					@dragstart="onDragStart($event, nodeType.type)"
					@click="!readonly && addNodeToCanvas(nodeType.type)"
					class="palette-node"
					:class="{ disabled: readonly }"
				>
					<v-icon :name="nodeType.icon" />
					<span>{{ nodeType.label }}</span>
				</div>
			</div>
		</div>
		
		<div class="sidebar-section">
			<div class="section-title">Instructions</div>
			<div class="instructions">
				<p>Drag nodes from the palette to the canvas to build your flow.</p>
				<p>Connect nodes by dragging from one handle to another.</p>
				<p>Click on nodes to edit their properties.</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	readonly?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	'add-node': [type: string];
}>();

const nodeTypes = [
	{
		type: 'terminal',
		label: 'Start/End',
		icon: 'radio_button_checked',
		description: 'Start or end point of the flow'
	},
	{
		type: 'process',
		label: 'Process',
		icon: 'crop_square',
		description: 'Process step with linked collections'
	},
	{
		type: 'decision',
		label: 'Decision',
		icon: 'change_history',
		description: 'Decision point with multiple outcomes'
	},
	{
		type: 'flow-link',
		label: 'Flow Link',
		icon: 'link',
		description: 'Link to another flow'
	}
];

const onDragStart = (event: DragEvent, nodeType: string) => {
	if (props.readonly) return;
	
	event.dataTransfer?.setData('application/node-type', nodeType);
	event.dataTransfer!.effectAllowed = 'move';
};

const addNodeToCanvas = (nodeType: string) => {
	if (props.readonly) return;
	emit('add-node', nodeType);
};
</script>

<style scoped>
.layout-sidebar {
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding: 16px;
	width: 250px;
	background: var(--background-normal);
	border-right: var(--border-width) solid var(--border-normal);
}

.sidebar-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.section-title {
	font-weight: 600;
	color: var(--foreground-normal);
	font-size: 14px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.node-palette {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.palette-node {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: var(--background-subdued);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	cursor: grab;
	transition: all var(--fast) var(--transition);
	user-select: none;
}

.palette-node:hover:not(.disabled) {
	background: var(--background-normal-alt);
	border-color: var(--border-normal-alt);
	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.palette-node:active:not(.disabled) {
	cursor: grabbing;
	transform: translateY(0);
}

.palette-node.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.palette-node .v-icon {
	color: var(--primary);
	flex-shrink: 0;
}

.palette-node span {
	font-weight: 500;
	color: var(--foreground-normal);
}

.instructions {
	font-size: 13px;
	color: var(--foreground-subdued);
	line-height: 1.5;
}

.instructions p {
	margin: 0 0 8px 0;
}

.instructions p:last-child {
	margin-bottom: 0;
}
</style>
