<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { VueFlow, type Node, type Edge, type Connection, type EdgeUpdateEvent, useVueFlow } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { Background } from '@vue-flow/background';
import type { Field, ValidationError } from '@directus/types';

// Import your custom node components
import TerminalNode from '../flow-nodes/TerminalNode.vue';
import ProcessNode from '../flow-nodes/ProcessNode.vue';
import DecisionNode from '../flow-nodes/DecisionNode.vue';
import ConnectorNode from '../flow-nodes/ConnectorNode.vue';

interface Props {
	collection: string;
	primaryKey?: string | null;
	isNew: boolean;
	item: Record<string, any> | null;
	edits: Record<string, any>;
	fields: Field[];
	loading: boolean;
	saving: boolean;
	validationErrors: ValidationError[];
	collectionInfo: any;
	permissions: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	'update:edits': [value: Record<string, any>];
	save: [];
	refresh: [];
}>();

// Vue Flow instance
const { project, fitView } = useVueFlow();

// Flow state
const selectedNode = ref<Node | null>(null);
const flowNodes = ref<Node[]>([
	// Initialize with some example nodes for testing
	{
		id: '1',
		type: 'input',
		position: { x: 250, y: 5 },
		label: 'Start Node',
		data: { label: 'Start Node', description: 'Starting point of the flow' },
	},
	{
		id: '2',
		type: 'default',
		position: { x: 100, y: 100 },
		label: 'Process Node',
		data: { label: 'Process Node', description: 'Processing step' },
	},
	{
		id: '3',
		type: 'output',
		position: { x: 400, y: 200 },
		label: 'End Node',
		data: { label: 'End Node', description: 'End point of the flow' },
	},
]);
const flowEdges = ref<Edge[]>([
	{
		id: 'e1-2',
		source: '1',
		target: '2',
	},
	{
		id: 'e2-3',
		source: '2',
		target: '3',
		animated: true,
	},
]);

// Node types for the palette
const nodeTypes = [
	{ type: 'terminal', label: 'Terminal', icon: 'radio_button_checked' },
	{ type: 'process', label: 'Process', icon: 'settings' },
	{ type: 'decision', label: 'Decision', icon: 'help' },
	{ type: 'connector', label: 'Connector', icon: 'circle' },
];

const hasChanges = computed(() => Object.keys(props.edits).length > 0);

// Initialize flow data from item
watch(() => props.item, (newItem) => {
	if (newItem?.flow_data) {
		try {
			const flowData = typeof newItem.flow_data === 'string'
				? JSON.parse(newItem.flow_data)
				: newItem.flow_data;

			flowNodes.value = flowData.nodes || [];
			flowEdges.value = flowData.edges || [];

			// Fit view after loading data
			if (flowData.nodes && flowData.nodes.length > 0) {
				nextTick(() => {
					fitView({ padding: 0.1, includeHiddenNodes: false });
				});
			}
		} catch {
			// Error parsing flow data
			flowNodes.value = [];
			flowEdges.value = [];
		}
	}
}, { immediate: true });

// Watch for changes in nodes/edges and update edits
watch([flowNodes, flowEdges], () => {
	const flowData = {
		nodes: flowNodes.value,
		edges: flowEdges.value,
	};

	updateField('flow_data', JSON.stringify(flowData));
}, { deep: true });

// Only fit view on initial load, not when nodes change
// watch(flowNodes, (newNodes) => {
// 	if (newNodes.length > 0) {
// 		// Use nextTick to ensure DOM is updated
// 		nextTick(() => {
// 			fitView({ padding: 0.1, includeHiddenNodes: false });
// 		});
// 	}
// }, { deep: true });

function updateField(fieldKey: string, value: any) {
	const newEdits = { ...props.edits };
	newEdits[fieldKey] = value;
	emit('update:edits', newEdits);
}

function saveFlow() {
	emit('save');
}

// Node palette drag and drop
function onDragStart(event: DragEvent, nodeType: any) {
	if (event.dataTransfer) {
		event.dataTransfer.setData('application/vueflow', JSON.stringify(nodeType));
		event.dataTransfer.effectAllowed = 'move';
	}
}

function onDragOver(event: DragEvent) {
	event.preventDefault();

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move';
	}

	// Add visual feedback for drop zone
	const canvasElement = document.querySelector('.canvas-container') as HTMLElement;
	if (canvasElement) {
		canvasElement.classList.add('drag-over');
	}
}

function onDragLeave(event: DragEvent) {
	// Remove visual feedback when leaving the drop zone
	const canvasElement = document.querySelector('.canvas-container') as HTMLElement;
	if (canvasElement && !canvasElement.contains(event.relatedTarget as HTMLElement)) {
		canvasElement.classList.remove('drag-over');
	}
}

function onDrop(event: DragEvent) {
	const data = event.dataTransfer?.getData('application/vueflow');

	// Remove visual feedback
	const canvasElement = document.querySelector('.canvas-container') as HTMLElement;
	if (canvasElement) {
		canvasElement.classList.remove('drag-over');
	}

	if (data) {
		const nodeType = JSON.parse(data);

		// Get the canvas container element for proper positioning
		const vueFlowElement = document.querySelector('.canvas-container .vue-flow') as HTMLElement;
		if (!vueFlowElement) return;

		const canvasBounds = vueFlowElement.getBoundingClientRect();

		// Convert screen coordinates to flow coordinates
		const position = project({
			x: event.clientX - canvasBounds.left,
			y: event.clientY - canvasBounds.top
		});

		const newNode: Node = {
			id: `${nodeType.type}-${Date.now()}`,
			type: nodeType.type,
			position,
			label: `${nodeType.label} Node`, // Vue Flow expects label at root level
			data: {
				label: `${nodeType.label} Node`, // Also in data for custom nodes
				description: '',
			},
		};

		flowNodes.value.push(newNode);
	}
}

// Node selection and editing
function onNodeClick(event: { node: Node }) {
	selectedNode.value = event.node;
}

function onEdgeClick(_event: any) {
	selectedNode.value = null;
}

function updateNodeData() {
	// Trigger reactivity
	flowNodes.value = [...flowNodes.value];
}

function deleteSelectedNode() {
	if (selectedNode.value) {
		const nodeId = selectedNode.value.id;
		flowNodes.value = flowNodes.value.filter((node: Node) => node.id !== nodeId);

		flowEdges.value = flowEdges.value.filter((edge: Edge) =>
			edge.source !== nodeId && edge.target !== nodeId
		);

		selectedNode.value = null;
	}
}

// Edge connections
function onConnect(connection: Connection) {
	flowEdges.value.push({
		id: `edge-${Date.now()}`,
		...connection,
	});
}

function onEdgeUpdate(event: EdgeUpdateEvent) {
	const { edge: oldEdge, connection: newConnection } = event;
	const index = flowEdges.value.findIndex((edge: Edge) => edge.id === oldEdge.id);

	if (index !== -1) {
		flowEdges.value[index] = { ...oldEdge, ...newConnection };
	}
}
</script>

<template>
	<div class="visual-flow-builder-editor">
		<!-- Header -->
		<div class="editor-header">
			<div class="title-section">
				<div class="flow-title-input">
					<v-input
						:model-value="edits.name ?? item?.name ?? ''"
						placeholder="Enter flow name..."
						class="flow-name-input"
						@update:model-value="updateField('name', $event)"
					/>
					<span class="flow-subtitle">{{ isNew ? 'New Flow' : 'Editing Flow' }}</span>
				</div>
			</div>
			<div class="header-actions">
				<v-button secondary @click="$emit('refresh')">
					<v-icon name="refresh" />
					Refresh
				</v-button>
				<v-button
					:loading="saving"
					:disabled="!hasChanges"
					@click="saveFlow"
				>
					<v-icon name="check" />
					Save Flow
				</v-button>
			</div>
		</div>

		<!-- Visual Flow Builder -->
		<div class="flow-builder-container">
			<div class="builder-layout">
				<!-- Left Sidebar - Node Palette -->
				<div class="node-palette">
					<h3>Node Types</h3>
					<div class="node-types">
						<div
							v-for="nodeType in nodeTypes"
							:key="nodeType.type"
							class="node-item"
							:class="nodeType.type"
							draggable
							@dragstart="onDragStart($event, nodeType)"
						>
							<div class="node-preview">
								<v-icon :name="nodeType.icon" />
							</div>
							<span class="node-label">{{ nodeType.label }}</span>
						</div>
					</div>
				</div>

				<!-- Center - Vue Flow Canvas -->
				<div class="canvas-container">
					<VueFlow
						v-model:nodes="flowNodes"
						v-model:edges="flowEdges"
						snap-to-grid
						:snap-grid="[20, 20]"
						:nodes-draggable="true"
						:edges-updatable="true"
						:edges-reconnectable="true"
						:elements-selectable="true"
						:default-viewport="{ x: 0, y: 0, zoom: 1 }"
						:min-zoom="0.1"
						:max-zoom="4"
						:fit-view-on-init="true"
						:fit-view-on-init-options="{ padding: 0.1 }"
						:zoom-on-scroll="true"
						:zoom-on-pinch="true"
						:pan-on-drag="[1, 2]"
						:selection-key-code="'Shift'"
						:zoom-on-double-click="false"
						@node-click="onNodeClick"
						@edge-click="onEdgeClick"
						@drop="onDrop"
						@dragover="onDragOver"
						@dragleave="onDragLeave"
						@connect="onConnect"
						@edge-update="onEdgeUpdate"
					>
						<!-- Custom Node Templates -->
						<template #node-terminal="nodeProps">
							<TerminalNode v-bind="nodeProps" />
						</template>
						<template #node-process="nodeProps">
							<ProcessNode v-bind="nodeProps" />
						</template>
						<template #node-decision="nodeProps">
							<DecisionNode v-bind="nodeProps" />
						</template>
						<template #node-connector="nodeProps">
							<ConnectorNode v-bind="nodeProps" />
						</template>

						<!-- Controls -->
						<Controls />

						<!-- Background with grid -->
						<Background pattern="dots" :gap="20" :size="1" color="#aaa" />
					</VueFlow>
				</div>

				<!-- Right Sidebar - Flow & Node Details -->
				<div class="details-sidebar">
					<!-- Flow Description Section -->
					<div class="sidebar-section">
						<h3>Flow Description</h3>
						<v-textarea
							:model-value="edits.description ?? item?.description ?? ''"
							placeholder="Describe this flow..."
							rows="3"
							@update:model-value="updateField('description', $event)"
						/>
					</div>

					<!-- Node Details Section -->
					<div class="sidebar-section">
						<h3>Node Details</h3>
						<div v-if="selectedNode" class="node-properties">
							<div class="property-group">
								<label>Label</label>
								<v-input v-model="selectedNode.data.label" @input="updateNodeData" />
							</div>
							<div class="property-group">
								<label>Description</label>
								<v-textarea v-model="selectedNode.data.description" @input="updateNodeData" />
							</div>
							<div class="property-group">
								<label>Type</label>
								<v-input :model-value="selectedNode.type" readonly />
							</div>

							<!-- Delete Node Button -->
							<div class="property-group">
								<v-button
									kind="danger"
									block
									@click="deleteSelectedNode"
								>
									<v-icon name="delete" />
									Delete Node
								</v-button>
							</div>
						</div>
						<div v-else class="no-selection">
							<p>Select a node to edit its properties</p>
						</div>
					</div>

					<!-- Flow Statistics -->
					<div class="sidebar-section">
						<h3>Flow Stats</h3>
						<div class="stats-grid">
							<div class="stat-item">
								<span class="stat-label">Nodes</span>
								<span class="stat-value">{{ flowNodes.length }}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Connections</span>
								<span class="stat-value">{{ flowEdges.length }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Validation Errors -->
		<div v-if="validationErrors.length > 0" class="validation-errors">
			<h3>Validation Errors:</h3>
			<ul>
				<li v-for="error in validationErrors" :key="error.field">
					{{ error.field }}: {{ error.code }}
				</li>
			</ul>
		</div>
	</div>
</template>

<style>
/* Import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* Import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';

/* Import Controls styles */
@import '@vue-flow/controls/dist/style.css';
</style>

<style scoped>
.visual-flow-builder-editor {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--theme--background);
}

.editor-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 2rem;
	border-bottom: 1px solid var(--theme--border-color);
	background: var(--theme--background-accent);
	flex-shrink: 0;
}

.flow-title-input {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.flow-name-input {
	font-size: 1.5rem;
	font-weight: 600;
}

.flow-subtitle {
	font-size: 0.875rem;
	color: var(--theme--foreground-subdued);
}

.header-actions {
	display: flex;
	gap: 0.5rem;
}

.flow-builder-container {
	flex: 1;
	overflow: hidden;
	position: relative;
}

.builder-layout {
	display: grid;
	grid-template-columns: 250px 1fr 300px;
	height: 100%;
}

.node-palette {
	background: var(--theme--background-subdued);
	border-right: 1px solid var(--theme--border-color);
	padding: 1.5rem;
	overflow-y: auto;
	z-index: 10;
}

.node-palette h3 {
	margin: 0 0 1.5rem 0;
	color: var(--theme--foreground);
	font-size: 1.1rem;
	font-weight: 600;
}

.node-types {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.node-item {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	background: var(--theme--background-normal);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	cursor: grab;
	transition: all 0.2s;
	min-height: 60px;
}

.node-item:hover {
	background: var(--theme--background-accent);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.node-item:active {
	cursor: grabbing;
	transform: translateY(0);
}

.node-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background: var(--theme--primary-background);
	border-radius: 50%;
	color: var(--theme--primary);
}

.node-preview .v-icon {
	font-size: 18px;
}

.node-label {
	font-size: 0.9rem;
	font-weight: 500;
	color: var(--theme--foreground);
}

.canvas-container {
	position: relative;
	background: var(--theme--background);
	width: 100%;
	height: 100%;
	overflow: hidden;
	transition: all 0.2s ease;
}

.canvas-container.drag-over {
	background: var(--theme--primary-background);
	border: 2px dashed var(--theme--primary);
}

.details-sidebar {
	background: var(--theme--background-subdued);
	border-left: 1px solid var(--theme--border-color);
	padding: 1rem;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	z-index: 10;
}

.sidebar-section {
	background: var(--theme--background-normal);
	padding: 1rem;
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color);
}

.sidebar-section h3 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
	font-size: 1rem;
}

.property-group {
	margin-bottom: 1rem;
}

.property-group label {
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: var(--theme--foreground);
}

.no-selection {
	text-align: center;
	color: var(--theme--foreground-subdued);
	margin-top: 2rem;
}

.validation-errors {
	background: var(--theme--danger-background);
	color: var(--theme--danger);
	padding: 1rem 2rem;
	border-top: 1px solid var(--theme--danger);
	flex-shrink: 0;
}

.validation-errors h3 {
	margin: 0 0 0.5rem 0;
}

.validation-errors ul {
	margin: 0;
	padding-left: 1.5rem;
}

.stats-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.5rem;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0.75rem;
	background: var(--theme--background-accent);
	border-radius: var(--theme--border-radius);
	text-align: center;
}

.stat-label {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.stat-value {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--theme--foreground);
	margin-top: 0.25rem;
}

/* Vue Flow specific styling to ensure proper canvas bounds */
.canvas-container :deep(.vue-flow) {
	width: 100%;
	height: 100%;
}

.canvas-container :deep(.vue-flow__viewport) {
	width: 100%;
	height: 100%;
}

.canvas-container :deep(.vue-flow__background) {
	width: 100%;
	height: 100%;
}

.canvas-container :deep(.vue-flow__pane) {
	width: 100%;
	height: 100%;
}

.canvas-container :deep(.vue-flow__node) {
	cursor: pointer;
}

.canvas-container :deep(.vue-flow__node.selected) {
	box-shadow: 0 0 0 2px var(--theme--primary);
}

.canvas-container :deep(.vue-flow__edge) {
	cursor: pointer;
}

.canvas-container :deep(.vue-flow__edge.selected) {
	stroke: var(--theme--primary);
	stroke-width: 2px;
}
</style>
