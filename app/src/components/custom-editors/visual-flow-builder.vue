<script setup lang="ts">
import { computed, ref, watch, nextTick, provide, onMounted, onUnmounted } from 'vue';
import { VueFlow, ConnectionMode, useVueFlow } from '@vue-flow/core';
import type { Node, Edge, EdgeUpdateEvent, Connection } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { Background } from '@vue-flow/background';
import type { Field, ValidationError } from '@directus/types';
import { useApi } from '@directus/composables';

// Import your custom node components
import TerminalNode from '../flow-nodes/TerminalNode.vue';
import ProcessNode from '../flow-nodes/ProcessNode.vue';
import DecisionNode from '../flow-nodes/DecisionNode.vue';
import OffPageNode from '../flow-nodes/OffPageNode.vue';

// Import custom header components
import CustomHeaderBasic from '../custom-headers/custom-header-basic.vue';
import CustomHeaderMinimal from '../custom-headers/custom-header-minimal.vue';
import CustomHeaderAdvanced from '../custom-headers/custom-header-advanced.vue';
import CustomHeaderProcessMap from '../custom-headers/custom-header-process-map.vue';
import CustomHeaderVisualFlow from '../custom-headers/custom-header-visual-flow.vue';

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
	mode?: 'edit' | 'view';
}

const props = withDefaults(defineProps<Props>(), {
	mode: 'edit',
});

// Check if user can edit based on permissions
const canEdit = computed(() => {
	// Check for create permission on new items, update permission on existing items
	if (props.isNew) {
		return props.permissions?.create !== false;
	}
	return props.permissions?.update !== false;
});

const emit = defineEmits<{
	'update:edits': [value: Record<string, any>];
	save: [];
	refresh: [];
	delete: [];
	archive: [];
	'save-as-copy': [];
	'update:mode': [mode: 'edit' | 'view'];
}>();

// API and navigation setup
const api = useApi();
const currentWorkflowId = computed(() => props.primaryKey || props.item?.id || 'new');

// Mode-based behavior
const isEditMode = computed(() => props.mode === 'edit');
const isViewMode = computed(() => props.mode === 'view');

// Follow mode state
const followMode = ref(false);
const focusedNodeId = ref<string | null>(null);
const availableWorkflows = ref<Array<{ id: string; name: string }>>([]);

// Provide API and current workflow ID to child components
provide('api', api);
provide('currentWorkflowId', currentWorkflowId.value);
provide('collection', props.collection);
provide('availableWorkflows', availableWorkflows);

// Fetch available workflows from Directus
const fetchWorkflows = async () => {
	try {
		if (!api) {
			console.warn('API not available for fetching workflows');
			return;
		}

		// Only fetch workflows if we're not creating a new item
		if (currentWorkflowId.value === '+' || !currentWorkflowId.value) {
			availableWorkflows.value = [];
			return;
		}

		// Use the current collection for fetching other workflows
		const response = await api.get(`/items/${props.collection}`, {
			params: {
				fields: ['id', 'name'],
				filter: {
					id: {
						_neq: currentWorkflowId.value // Exclude current workflow
					}
				}
			}
		});

		availableWorkflows.value = response.data.data || [];
	} catch (error) {
		console.error('Failed to fetch workflows:', error);
		availableWorkflows.value = [];
	}
};

// Function to fetch available collections for form nodes
const fetchCollections = async () => {
	try {
		const response = await api.get('/collections', {
			params: {
				fields: ['collection', 'meta.name']
			}
		});

		availableCollections.value = response.data.data
			.filter((collection: any) => !collection.collection.startsWith('directus_')) // Filter out system collections
			.map((collection: any) => ({
				value: collection.collection,
				text: collection.meta?.name || collection.collection
			}));
	} catch (error) {
		console.error('Failed to fetch collections:', error);
		availableCollections.value = [];
	}
};

// Handle workflow navigation
const navigateToWorkflow = (workflowId: string) => {
	// Update the field data to ensure current state is saved
	updateField('flow_data', {
		nodes: flowNodes.value,
		edges: flowEdges.value,
	});
	
	// Use the correct Directus URL format for collections and open in new tab
	const targetUrl = `/admin/content/${props.collection}/${workflowId}`;
	window.open(targetUrl, '_blank');
};

// Handle collection opening in new window
const openCollection = (collectionName: string) => {
	// Construct the URL for creating a new entry in the collection
	const collectionUrl = `/admin/content/${collectionName}/+`;
	// Open in a new window/tab
	window.open(collectionUrl, '_blank');
};

// Vue Flow composable
const { project, fitView, updateEdge, zoomTo, getViewport, setViewport } = useVueFlow();

// Flow state
const selectedNode = ref<Node | null>(null);
const availableCollections = ref<any[]>([]);
const showDescriptionModal = ref(false);
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
	{ type: 'terminal', label: 'Terminal', icon: 'radio_button_checked' }, // Start/End (oval)
	{ type: 'process', subtype: 'task', label: 'Task', icon: 'crop_square' }, // Task process (blue rectangle)
	{ type: 'process', subtype: 'form', label: 'Form', icon: 'description' }, // Form process (green rectangle)
	{ type: 'decision', label: 'Decision', icon: 'change_history' }, // Decision (diamond)
	{ type: 'offpage', label: 'Off-page Connector', icon: 'home' }, // Off-page connector (house shape)
];

// Custom header logic
const shouldUseCustomHeader = computed(() => {
	const customHeader = (props.collectionInfo?.meta as any)?.custom_header_component;
	return !!customHeader && customHeader !== null;
});

const customHeaderName = computed(() => {
	return (props.collectionInfo?.meta as any)?.custom_header_component || 'custom-header-basic';
});

const customHeaders = {
	'custom-header-basic': CustomHeaderBasic,
	'custom-header-minimal': CustomHeaderMinimal,
	'custom-header-advanced': CustomHeaderAdvanced,
	'custom-header-process-map': CustomHeaderProcessMap,
	'custom-header-visual-flow': CustomHeaderVisualFlow,
};

const customHeaderComponent = computed(() => {
	const componentName = customHeaderName.value;
	return customHeaders[componentName as keyof typeof customHeaders] || CustomHeaderBasic;
});

const title = computed(() => {
	return props.isNew 
		? `Creating ${props.collectionInfo?.name || props.collection}` 
		: `Editing ${props.collectionInfo?.name || props.collection}`;
});

const hasChanges = computed(() => {
	// Check if there are any edits in the props.edits object
	return Object.keys(props.edits).length > 0;
});

// Fetch workflows and collections on component mount
onMounted(() => {
	// Hide the default Directus header when using custom headers
	if (shouldUseCustomHeader.value) {
		const headerBar = document.querySelector('.header-bar');
		if (headerBar) {
			(headerBar as HTMLElement).style.display = 'none';
		}
	}
	
	// Add keyboard event listener for follow mode navigation
	document.addEventListener('keydown', handleKeyDown);
	
	fetchWorkflows();
	fetchCollections();
});

onUnmounted(() => {
	// Clean up keyboard event listener
	document.removeEventListener('keydown', handleKeyDown);
});

// Initialize flow data from item
watch(() => props.item, (newItem) => {
	if (newItem?.flow_data) {
		try {
			const flowData = typeof newItem.flow_data === 'string'
				? JSON.parse(newItem.flow_data)
				: newItem.flow_data;

			flowNodes.value = flowData.nodes || [];
			// Convert existing edges to step type and make them animated
			flowEdges.value = (flowData.edges || []).map((edge: Edge) => ({
				...edge,
				type: 'step',
				animated: true,
			}));

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
	// Prevent field updates during save to avoid triggering hasEdits after save completes
	if (props.saving) return;
	
	const newEdits = { ...props.edits };
	newEdits[fieldKey] = value;
	emit('update:edits', newEdits);
}

function saveFlow() {
	// Clear local edits immediately to prevent navigation warning
	emit('update:edits', {});
	emit('save');
}

// Handle custom header events
function handleUpdateFlowName(name: string) {
	updateField('name', name);
}

function handleModeChange(newMode: 'edit' | 'view') {
	emit('update:mode', newMode);
}

// Follow mode functionality
function toggleFollowMode(enabled: boolean) {
	followMode.value = enabled;
	
	if (enabled) {
		// If no node is focused, focus on the first node
		if (!focusedNodeId.value && flowNodes.value.length > 0) {
			const firstNode = flowNodes.value[0];
			if (firstNode?.id) {
				focusOnNode(firstNode.id);
			}
		} else if (focusedNodeId.value) {
			// Re-focus on current node to zoom in
			focusOnNode(focusedNodeId.value);
		}
	} else {
		// Remove focused class from all nodes when follow mode is disabled
		flowNodes.value.forEach(n => {
			if (n.class && typeof n.class === 'string') {
				n.class = n.class.replace(/\s*(focused|decision-focused)\s*/g, ' ').trim();
			}
		});
		focusedNodeId.value = null;
	}
}

function focusOnNode(nodeId: string) {
	const node = flowNodes.value.find(n => n.id === nodeId);
	if (!node) return;
	
	focusedNodeId.value = nodeId;
	
	// Remove focused class from all nodes
	flowNodes.value.forEach(n => {
		if (n.class && typeof n.class === 'string') {
			n.class = n.class.replace(/\s*(focused|decision-focused)\s*/g, ' ').trim();
		}
	});
	
	// Add focused class to the target node
	const targetNode = flowNodes.value.find(n => n.id === nodeId);
	if (targetNode) {
		const currentClass = typeof targetNode.class === 'string' ? targetNode.class : '';
		// Add both focused class and type-specific class for styling
		const focusClass = targetNode.type === 'decision' ? ' focused decision-focused' : ' focused';
		targetNode.class = (currentClass + focusClass).trim();
	}
	
	// Move the viewport to the node with smooth animation
	fitView({
		nodes: [nodeId],
		duration: 400,
		padding: 0.3,
		maxZoom: 1.5,
		minZoom: 1.2
	});
}

// Get connected nodes based on direction
function getConnectedNode(nodeId: string, direction: 'up' | 'down' | 'left' | 'right'): string | null {
	const edges = flowEdges.value;
	const currentNode = flowNodes.value.find(n => n.id === nodeId);
	if (!currentNode) return null;
	
	// Find edges connected to this node
	const connectedEdges = edges.filter(edge => 
		edge.source === nodeId || edge.target === nodeId
	);
	
	// For simplicity, we'll use a basic approach:
	// up/down: follow output/input connections
	// left/right: find nodes to the left/right based on position
	
	if (direction === 'down') {
		// Follow outgoing connections (this node is source)
		const outgoingEdge = connectedEdges.find(edge => edge.source === nodeId);
		return outgoingEdge?.target || null;
	}
	
	if (direction === 'up') {
		// Follow incoming connections (this node is target)
		const incomingEdge = connectedEdges.find(edge => edge.target === nodeId);
		return incomingEdge?.source || null;
	}
	
	// For left/right, find nearest node in that direction
	const allNodes = flowNodes.value.filter(n => n && n.id !== nodeId);
	const currentPos = currentNode.position;
	
	let targetNodes = allNodes;
	
	if (direction === 'left') {
		targetNodes = allNodes.filter(n => n && n.position && n.position.x < currentPos.x);
	} else if (direction === 'right') {
		targetNodes = allNodes.filter(n => n && n.position && n.position.x > currentPos.x);
	}
	
	// Find the closest node
	if (targetNodes.length === 0) return null;
	
	let closest = targetNodes[0];
	if (!closest || !closest.position) return null;
	
	for (let i = 1; i < targetNodes.length; i++) {
		const node = targetNodes[i];
		if (!node || !node.position) continue;
		
		const closestDist = Math.sqrt(
			Math.pow(currentPos.x - closest.position.x, 2) + 
			Math.pow(currentPos.y - closest.position.y, 2)
		);
		const nodeDist = Math.sqrt(
			Math.pow(currentPos.x - node.position.x, 2) + 
			Math.pow(currentPos.y - node.position.y, 2)
		);
		if (nodeDist < closestDist) {
			closest = node;
		}
	}
	
	return closest?.id || null;
}

// Navigate between nodes using arrow keys
function navigateNode(direction: 'up' | 'down' | 'left' | 'right') {
	if (!followMode.value || !focusedNodeId.value) return;
	
	const nextNodeId = getConnectedNode(focusedNodeId.value, direction);
	if (nextNodeId) {
		focusOnNode(nextNodeId);
	}
}

// Handle keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
	if (!followMode.value) return;
	
	// Prevent default behavior for arrow keys
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
		event.preventDefault();
		
		switch (event.key) {
			case 'ArrowUp':
				navigateNode('up');
				break;
			case 'ArrowDown':
				navigateNode('down');
				break;
			case 'ArrowLeft':
				navigateNode('left');
				break;
			case 'ArrowRight':
				navigateNode('right');
				break;
		}
	}
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
				...(nodeType.subtype && { subtype: nodeType.subtype }), // Add subtype if present
				...(nodeType.subtype === 'form' && { targetCollection: '' }), // Initialize targetCollection for form nodes
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

function updateProcessSubtype(subtype: 'task' | 'form') {
	if (selectedNode.value && selectedNode.value.type === 'process') {
		selectedNode.value.data.subtype = subtype;
		if (subtype === 'form' && !selectedNode.value.data.targetCollection) {
			selectedNode.value.data.targetCollection = '';
		}
		updateNodeData();
	}
}

function updateFormCollection(collectionName: string) {
	if (selectedNode.value && selectedNode.value.type === 'process' && selectedNode.value.data.subtype === 'form') {
		selectedNode.value.data.targetCollection = collectionName;
		updateNodeData();
	}
}

function updateOffPageTarget(workflowId: string) {
	if (selectedNode.value && selectedNode.value.type === 'offpage') {
		selectedNode.value.data.targetWorkflowId = workflowId;
		updateNodeData();
		
		// Save the changes
		updateField('flow_data', {
			nodes: flowNodes.value,
			edges: flowEdges.value,
		});
	}
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
		type: 'step',
		animated: true,
		...connection,
	});
}

function onEdgeUpdate(event: EdgeUpdateEvent) {
	console.log('onEdgeUpdate called with:', event);
	const { edge: oldEdge, connection: newConnection } = event;
	
	console.log('Old edge:', oldEdge, 'New connection:', newConnection);

	// Use Vue Flow's built-in updateEdge function
	updateEdge(oldEdge, newConnection);
	
	console.log('Used Vue Flow updateEdge function');
	
	// Save the changes to the field data after a short delay to ensure Vue Flow has updated
	nextTick(() => {
		updateField('flow_data', {
			nodes: flowNodes.value,
			edges: flowEdges.value,
		});
		
		console.log('Field data updated and saved in nextTick');
		console.log('Current edges:', flowEdges.value);
	});
}
</script>

<template>
	<div class="visual-flow-builder-wrapper" :class="{ 'custom-header-active': shouldUseCustomHeader }">
		<!-- Custom Header Integration -->
		<component
			v-if="shouldUseCustomHeader"
			:is="customHeaderComponent"
			:collection="collection || ''"
			:primary-key="primaryKey?.toString() || null"
			:title="title"
			:has-edits="hasChanges"
			:saving="saving || false"
			:is-new="isNew || false"
			:collection-info="collectionInfo"
			:item="item"
			:validation-errors="validationErrors || []"
			:flow-name="edits.name ?? item?.name ?? ''"
			:mode="mode"
			:can-edit="canEdit"
			:follow-mode="followMode"
			@save="emit('save')"
			@delete="emit('delete')"
			@archive="emit('archive')"
			@refresh="emit('refresh')"
			@save-as-copy="emit('save-as-copy')"
			@update-flow-name="handleUpdateFlowName"
			@update-mode="handleModeChange"
			@toggle-follow-mode="toggleFollowMode"
		/>

		<div class="visual-flow-builder-editor" :class="{ 'hide-default-header': shouldUseCustomHeader }">
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
				<!-- Left Sidebar - Node Palette (only in edit mode) -->
				<div v-if="isEditMode" class="node-palette">
					<h3>Node Types</h3>
					<div class="node-types">
						<div
							v-for="nodeType in nodeTypes"
							:key="nodeType.type"
							class="node-item"
							:class="nodeType.type"
							draggable="true"
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
				<div 
					class="canvas-container"
					:class="{ 'full-width': isViewMode }"
					@drop="isEditMode ? onDrop : undefined"
					@dragover="isEditMode ? onDragOver : undefined"
					@dragleave="isEditMode ? onDragLeave : undefined"
				>
					<VueFlow
						v-model:nodes="flowNodes"
						v-model:edges="flowEdges"
						snap-to-grid
						:snap-grid="[20, 20]"
						:nodes-draggable="isEditMode"
						:edges-updatable="isEditMode"
						:edges-reconnectable="isEditMode"
						:connection-mode="ConnectionMode.Loose"
						:elements-selectable="true"
						:default-viewport="{ x: 0, y: 0, zoom: 1 }"
						:min-zoom="0.1"
						:max-zoom="4"
						:fit-view-on-init="true"
						:fit-view-on-init-options="{ padding: 0.1 }"
						:zoom-on-scroll="true"
						:zoom-on-pinch="true"
						:pan-on-drag="[1, 2]"
						:multi-selection-key-code="true"
						:zoom-on-double-click="false"
						@node-click="onNodeClick"
						@edge-click="onEdgeClick"
						@connect="isEditMode ? onConnect : () => {}"
						@edge-update="isEditMode ? onEdgeUpdate : () => {}"
						@edge-update-start="isEditMode ? (event: any) => console.log('Edge update start:', event) : () => {}"
						@edge-update-end="isEditMode ? (event: any) => console.log('Edge update end:', event) : () => {}"
					>
						<!-- Custom Node Templates -->
						<template #node-terminal="nodeProps">
							<TerminalNode v-bind="nodeProps" />
						</template>
						<template #node-process="nodeProps">
							<ProcessNode 
								v-bind="nodeProps" 
								@open-collection="openCollection"
							/>
						</template>
						<template #node-decision="nodeProps">
							<DecisionNode v-bind="nodeProps" />
						</template>
						<template #node-offpage="nodeProps">
							<OffPageNode 
								v-bind="nodeProps" 
								@navigate="navigateToWorkflow"
							/>
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
						<div class="description-preview">
							<p v-if="edits.description || item?.description" class="description-text">
								{{ (edits.description ?? item?.description ?? '').substring(0, 100) }}{{
									(edits.description ?? item?.description ?? '').length > 100 ? '...' : ''
								}}
							</p>
							<p v-else class="description-placeholder">
								No description yet
							</p>
							<v-button 
								v-if="isEditMode"
								secondary 
								@click="showDescriptionModal = true"
							>
								<v-icon name="edit" />
								{{ (edits.description || item?.description) ? 'Edit Description' : 'Add Description' }}
							</v-button>
						</div>
					</div>

					<!-- Node Details Section -->
					<div class="sidebar-section">
						<h3>Node Details</h3>
						<div v-if="selectedNode" class="node-properties">
							<div class="property-group">
								<label>Label</label>
								<v-input 
									v-model="selectedNode.data.label" 
									:readonly="isViewMode"
									@input="isEditMode ? updateNodeData : undefined" 
								/>
							</div>
							<div class="property-group">
								<label>Description</label>
								<v-textarea 
									v-model="selectedNode.data.description" 
									:readonly="isViewMode"
									@input="isEditMode ? updateNodeData : undefined" 
								/>
							</div>
							<div class="property-group">
								<label>Type</label>
								<v-input :model-value="selectedNode.type" readonly />
							</div>

							<!-- Process Node Subtype for Form/Task -->
							<div v-if="selectedNode.type === 'process'" class="property-group">
								<label>Process Type</label>
								<v-select
									:model-value="selectedNode.data.subtype || 'task'"
									:items="[
										{ text: 'Task', value: 'task' },
										{ text: 'Form', value: 'form' }
									]"
									:disabled="isViewMode"
									@update:model-value="isEditMode ? updateProcessSubtype : undefined"
								/>
							</div>

							<!-- Form Collection Selection -->
							<div v-if="selectedNode.type === 'process' && selectedNode.data.subtype === 'form'" class="property-group">
								<label>Target Collection</label>
								<v-select
									:model-value="selectedNode.data.targetCollection"
									:items="availableCollections"
									item-text="text"
									item-value="value"
									placeholder="Select collection for form..."
									:disabled="isViewMode"
									@update:model-value="isEditMode ? updateFormCollection : undefined"
								/>
							</div>

							<!-- Off-page Connector Workflow Selection -->
							<div v-if="selectedNode.type === 'offpage'" class="property-group">
								<label>Target Workflow</label>
								<v-select
									:model-value="selectedNode.data.targetWorkflowId"
									:items="availableWorkflows"
									item-text="name"
									item-value="id"
									placeholder="Select workflow to link to..."
									:disabled="isViewMode"
									@update:model-value="isEditMode ? updateOffPageTarget : undefined"
								/>
								<v-button
									v-if="selectedNode.data.targetWorkflowId"
									kind="secondary"
									small
									@click="navigateToWorkflow(selectedNode.data.targetWorkflowId)"
									style="margin-top: 8px;"
								>
									<v-icon name="open_in_new" style="margin-right: 4px;" />
									Open Workflow
								</v-button>
							</div>

							<!-- Delete Node Button (only in edit mode) -->
							<div v-if="isEditMode" class="property-group">
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

		<!-- Description Modal -->
		<v-dialog v-model="showDescriptionModal" :max-width="600">
			<v-card>
				<v-card-title>Flow Description</v-card-title>
				<v-card-text>
					<v-textarea
						:model-value="edits.description ?? item?.description ?? ''"
						placeholder="Describe this flow in detail..."
						rows="8"
						auto-grow
						@update:model-value="updateField('description', $event)"
					/>
				</v-card-text>
				<v-card-actions>
					<div style="flex: 1;"></div>
					<v-button secondary @click="showDescriptionModal = false">
						Cancel
					</v-button>
					<v-button @click="showDescriptionModal = false">
						Save
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
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
.visual-flow-builder-wrapper {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.visual-flow-builder-editor {
	height: 100%;
	display: flex;
	flex-direction: column;
	background: var(--theme--background);
	flex: 1;
	overflow: hidden;
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
	font-size: 2rem;
	font-weight: 700;
	min-height: 60px;
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
	overflow: hidden;
}

/* View mode layout without node palette */
.builder-layout:has(.canvas-container.full-width) {
	grid-template-columns: 1fr 300px;
}

.canvas-container.full-width {
	/* In view mode, canvas takes full width without node palette */
}

.node-palette {
	background: var(--theme--background-subdued);
	border-right: 1px solid var(--theme--border-color);
	padding: 1.5rem;
	overflow: hidden;
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
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	/* Ensure drag events work */
	-webkit-user-drag: element;
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
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
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

/* Follow mode focused node indicator */
:deep(.vue-flow__node.focused) {
	z-index: 1000 !important;
}

/* Hide default Vue Flow selection styling when focused */
:deep(.vue-flow__node.focused.selected) {
	outline: none !important;
	box-shadow: none !important;
}

:deep(.vue-flow__node.focused .vue-flow__node-default) {
	outline: none !important;
	box-shadow: none !important;
}

/* Custom focus styling that matches node shapes */
:deep(.vue-flow__node.focused .node-content) {
	position: relative;
	transition: all 0.3s ease !important;
}

:deep(.vue-flow__node.focused .node-content::before) {
	content: '';
	position: absolute;
	top: -4px;
	left: -4px;
	right: -4px;
	bottom: -4px;
	border: 3px solid var(--theme--primary);
	border-radius: inherit;
	pointer-events: none;
	z-index: -1;
	transition: all 0.3s ease;
}

/* Special handling for diamond-shaped decision nodes */
:deep(.vue-flow__node.decision-focused .node-content::before) {
	transform: rotate(45deg);
	border-radius: 0;
}

/* Override DecisionNode component's selected styling when focused */
:deep(.vue-flow__node.decision-focused .decision-node .diamond-shape) {
	border-color: transparent !important;
	box-shadow: none !important;
	transform: rotate(45deg) !important; /* Remove the scale */
}

/* Also override when node is just selected (not focused) */
:deep(.decision-node.selected .diamond-shape) {
	border-color: transparent !important;
	box-shadow: none !important;
}

/* Nuclear option: Remove ALL DecisionNode borders */
:deep(.decision-node .diamond-shape) {
	border: none !important;
}

/* Restore the original border only when NOT focused */
:deep(.vue-flow__node:not(.decision-focused) .decision-node .diamond-shape) {
	border: 2px solid #d97706 !important;
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

.description-preview {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.description-text {
	font-size: 0.875rem;
	line-height: 1.4;
	color: var(--theme--foreground);
	margin: 0;
	padding: 0.75rem;
	background: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color-subdued);
}

.description-placeholder {
	font-size: 0.875rem;
	color: var(--theme--foreground-subdued);
	font-style: italic;
	margin: 0;
	padding: 0.75rem;
	background: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	border: 1px dashed var(--theme--border-color-subdued);
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

/* Remove default selection style */
.canvas-container :deep(.vue-flow__node.selected) {
	box-shadow: none;
}

/* Terminal node selection - oval outline */
.canvas-container :deep(.vue-flow__node.selected .terminal-node) {
	outline: 3px solid var(--theme--primary);
	outline-offset: 2px;
}

/* Process node selection - rectangular outline */
.canvas-container :deep(.vue-flow__node.selected .process-node) {
	outline: 3px solid var(--theme--primary);
	outline-offset: 2px;
}

/* Decision node selection - diamond outline using clip-path */
.canvas-container :deep(.vue-flow__node.selected .decision-node) {
	position: relative;
}

.canvas-container :deep(.vue-flow__node.selected .decision-node::after) {
	content: '';
	position: absolute;
	top: -4px;
	left: -4px;
	right: -4px;
	bottom: -4px;
	background: transparent;
	border: 3px solid var(--theme--primary);
	clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
	pointer-events: none;
}

/* Off-page node selection - more visible pentagon outline */
.canvas-container :deep(.vue-flow__node.selected .offpage-node) {
	position: relative;
}

.canvas-container :deep(.vue-flow__node.selected .offpage-node::after) {
	content: '';
	position: absolute;
	top: -4px;
	left: -4px;
	right: -4px;
	bottom: -4px;
	background: transparent;
	border: 4px solid var(--theme--primary);
	clip-path: polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 100%, 0% 100%);
	pointer-events: none;
	box-shadow: 0 0 8px rgba(var(--theme--primary-rgb), 0.3);
}

.canvas-container :deep(.vue-flow__edge) {
	cursor: pointer;
}

.canvas-container :deep(.vue-flow__edge.selected) {
	stroke: var(--theme--primary);
	stroke-width: 2px;
}

/* Custom header integration */
.visual-flow-builder-wrapper.custom-header-active .hide-default-header .editor-header {
	display: none;
}

.visual-flow-builder-wrapper.custom-header-active {
	display: flex;
	flex-direction: column;
	height: 100vh;
}

.visual-flow-builder-wrapper.custom-header-active .visual-flow-builder-editor {
	flex: 1;
	height: auto;
}

/* Hide the default Directus header when using custom header */
:deep(.header-bar) {
	display: none !important;
}
</style>
