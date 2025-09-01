<template>
	<private-view title="Visual Flow Builder">
		<div class="visual-flow-builder">
			<!-- Header Controls -->
			<div class="header-controls">
				<div class="flow-selector">
					<v-select
						v-model="selectedFlowId"
						:items="flowOptions"
						:loading="loadingFlows"
						placeholder="Select a flow..."
						@update:model-value="onFlowSelect"
					/>
					<v-button @click="createNewFlow" :disabled="loadingFlows">
						New Flow
					</v-button>
				</div>
				
				<!-- Flow Details Section -->
				<div v-if="currentFlow" class="flow-details">
					<div class="flow-name-section">
						<div v-if="!renamingFlow" class="flow-name-display">
							<h2 class="flow-title">{{ currentFlow.name }}</h2>
							<v-button 
								@click="startRenaming" 
								icon 
								x-small 
								secondary
								v-tooltip="'Rename flow'"
							>
								<v-icon name="edit" />
							</v-button>
						</div>
						<div v-else class="flow-name-edit">
							<v-input 
								v-model="tempFlowName"
								ref="flowNameInput"
								placeholder="Enter flow name..."
								@keyup.enter="saveFlowName"
								@keyup.escape="cancelRenaming"
							/>
							<div class="rename-actions">
								<v-button 
									@click="saveFlowName" 
									:disabled="!tempFlowName || tempFlowName.trim() === ''"
									icon 
									x-small
								>
									<v-icon name="check" />
								</v-button>
								<v-button 
									@click="cancelRenaming" 
									icon 
									x-small 
									secondary
								>
									<v-icon name="close" />
								</v-button>
							</div>
						</div>
						<p v-if="currentFlow.description" class="flow-description">
							{{ currentFlow.description }}
						</p>
					</div>
					
					<div class="flow-actions">
						<v-button
							@click="saveFlow"
							:disabled="saving"
							secondary
						>
							{{ saving ? 'Saving...' : 'Save' }}
						</v-button>
						<v-button
							@click="deleteFlow"
							:disabled="saving"
							danger
							secondary
						>
							Delete
						</v-button>
					</div>
				</div>
			</div>

			<!-- Main Layout -->
			<div v-if="!currentFlow" class="no-flow-alert">
				<v-alert type="info">
					Please create or select a flow first before adding nodes.
				</v-alert>
			</div>

			<div v-else class="layout-container">
				<!-- Left Sidebar - Node Palette -->
				<div class="node-palette">
					<h3>Node Palette</h3>
					<div class="node-list">
						<div
							v-for="nodeType in nodeTypes"
							:key="nodeType.type"
							class="node-item"
							:class="nodeType.type"
							:draggable="!loadingFlows"
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
						v-model:nodes="nodes"
						v-model:edges="edges"
						:snap-to-grid="true"
						:snap-grid="[20, 20]"
						:nodes-draggable="true"
						:edges-updatable="true"
						:edges-reconnectable="true"
						:elements-selectable="true"
						:default-viewport="{ zoom: 1 }"
						:min-zoom="0.1"
						:max-zoom="4"
						:fit-view-on-init="true"
						:connection-line-style="{ strokeWidth: 2 }"
						:connection-radius="8"
						@node-click="onNodeClick"
						@edge-click="onEdgeClick"
						@drop="onDrop"
						@dragover="onDragOver"
						@connect="onConnect"
						@edge-update="onEdgeUpdate"
						@edge-update-start="onEdgeUpdateStart"
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
						<template #node-flow-link-phase="nodeProps">
							<FlowLinkNode v-bind="nodeProps" />
						</template>
						<template #node-flow-link-global="nodeProps">
							<FlowLinkNode v-bind="nodeProps" />
						</template>

						<!-- Controls -->
						<Controls />

						<!-- Background with grid -->
						<Background pattern="dots" :gap="20" :size="1" />
					</VueFlow>
				</div>

				<!-- Right Sidebar - Node Details -->
				<div class="node-details">
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

						<!-- Process Node Collections -->
						<div v-if="selectedNode.type === 'process'" class="property-group">
							<label>Linked Collections</label>
							<div class="collections-manager">
								<div v-if="selectedNode.data.collections && selectedNode.data.collections.length > 0" class="collection-list">
									<div 
										v-for="(collection, index) in selectedNode.data.collections" 
										:key="index"
										class="collection-item-edit"
									>
										<div class="collection-row">
											<v-select 
												v-model="collection.name" 
												:items="collectionOptions"
												item-text="text"
												item-value="value"
												placeholder="Select collection..."
												:loading="loadingCollections"
												@update:model-value="updateNodeData"
											/>
											<v-button 
												@click="removeCollection(index)"
												icon 
												secondary
												x-small
											>
												<v-icon name="delete" />
											</v-button>
										</div>
										<v-input 
											v-model="collection.label" 
											placeholder="Custom display label (optional)"
											@input="updateNodeData"
										/>
										<v-input 
											v-model="collection.url" 
											placeholder="Custom URL (optional)"
											@input="updateNodeData"
										/>
										<div class="open-mode-section">
											<label class="open-mode-label">Open Mode</label>
											<v-select 
												v-model="collection.openMode" 
												:items="openModeOptions"
												item-text="text"
												item-value="value"
												placeholder="Select open mode..."
												@update:model-value="updateNodeData"
											/>
										</div>
									</div>
								</div>
								<v-button @click="addCollection" secondary small :disabled="loadingCollections">
									<v-icon name="add" left />
									Add Collection
								</v-button>
								<div v-if="loadingCollections" class="loading-message">
									Loading collections...
								</div>
								<div v-else-if="availableCollections.length === 0" class="no-collections-message">
									No user collections found
								</div>
							</div>
						</div>

						<!-- Flow Link Node Management -->
						<div v-if="selectedNode.type === 'flow-link-phase'" class="property-group">
							<label>Linked Flow</label>
							<div class="flow-link-manager">
								<v-select 
									v-model="selectedNode.data.linkedFlowId" 
									:items="availableFlowOptions"
									item-text="text"
									item-value="value"
									placeholder="Select flow to link to..."
									:loading="loadingFlows"
									@update:model-value="onFlowLinkChange"
								/>
								<v-input 
									v-model="selectedNode.data.linkedFlowName" 
									placeholder="Custom display name (optional)"
									@input="updateNodeData"
								/>
								<div v-if="selectedNode.data.linkedFlowId" class="flow-link-info">
									<div class="link-status">
										<v-icon name="link" small />
										<span>Links to: {{ getFlowNameById(selectedNode.data.linkedFlowId) }}</span>
									</div>
								</div>
								<div v-else class="no-link-info">
									<span class="no-link-text">No flow selected</span>
								</div>
							</div>
						</div>

						<!-- Global Termination Info -->
						<div v-if="selectedNode.type === 'flow-link-global'" class="property-group">
							<label>Termination Type</label>
							<div class="termination-info">
								<div class="global-termination-display">
									<v-icon name="stop_circle" small />
									<span>Global Workflow Termination</span>
								</div>
								<p class="termination-description">
									This node will terminate the entire workflow process when reached.
								</p>
							</div>
						</div>
					</div>
					<div v-else class="no-selection">
						<p>Select a node to edit its properties</p>
					</div>
				</div>
			</div>
		</div>
	</private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { VueFlow, useVueFlow, type Node, type Edge, type Connection } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { Background } from '@vue-flow/background';

// Node Components
import TerminalNode from './components/TerminalNode.vue';
import ProcessNode from './components/ProcessNode.vue';
import DecisionNode from './components/DecisionNode.vue';
import FlowLinkNode from './components/FlowLinkNode.vue';

interface FlowData {
	id?: string;
	name: string;
	description?: string;
	nodes: Node[];
	edges: Edge[];
	status: string;
}

// State
const api = useApi();

const flows = ref<FlowData[]>([]);
const currentFlow = ref<FlowData | null>(null);
const selectedFlowId = ref<string | null>(null);
const loadingFlows = ref(false);
const saving = ref(false);

// Collections state
const availableCollections = ref<Array<{ name: string; label: string }>>([]);
const loadingCollections = ref(false);

// Vue Flow state
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const selectedNode = ref<Node | null>(null);

// Flow renaming state
const renamingFlow = ref(false);
const tempFlowName = ref('');
const flowNameInput = ref<HTMLInputElement | null>(null);

// Vue Flow composable
const { onEdgeUpdate: onEdgeUpdateEvent } = useVueFlow();

// Node types configuration
const nodeTypes = ref([
	{
		type: 'terminal',
		label: 'Terminal',
		icon: 'radio_button_checked'
	},
	{
		type: 'process',
		label: 'Process',
		icon: 'settings'
	},
	{
		type: 'decision',
		label: 'Decision',
		icon: 'help'
	},
	{
		type: 'flow-link-phase',
		label: 'Phase Transition',
		icon: 'arrow_forward_ios'
	},
	{
		type: 'flow-link-global',
		label: 'Global End',
		icon: 'stop_circle'
	}
]);

// Computed
const flowOptions = computed(() => {
	return flows.value.map(flow => ({
		text: flow.name,
		value: flow.id
	}));
});

const collectionOptions = computed(() => {
	return availableCollections.value.map(collection => ({
		text: collection.label,
		value: collection.name
	}));
});

// Available flows for linking (excluding current flow)
const availableFlowOptions = computed(() => {
	return flows.value
		.filter(flow => flow.id !== currentFlow.value?.id) // Exclude current flow
		.map(flow => ({
			text: flow.name,
			value: flow.id
		}));
});

// Open mode options for collections
const openModeOptions = computed(() => [
	{
		text: 'New Tab',
		value: 'tab'
	},
	{
		text: 'Modal',
		value: 'modal'
	}
]);

// Methods
const loadFlows = async () => {
	loadingFlows.value = true;
	try {
		const response = await api.get('/items/visual_flows');
		flows.value = response.data.data || [];
	} catch (error: any) {
		console.error('Failed to load flows:', error);
		flows.value = [];
	} finally {
		loadingFlows.value = false;
	}
};

const loadCollections = async () => {
	loadingCollections.value = true;
	try {
		console.log('Loading collections...');
		const response = await api.get('/collections', {
			params: {
				fields: ['collection', 'meta.*', 'schema.*']
			}
		});
		const collections = response.data.data || [];
		console.log('Raw collections response:', collections.length, 'collections');
		
		// Enhanced system collection filtering
		const systemCollections = [
			'directus_activity', 'directus_collections', 'directus_fields', 'directus_files',
			'directus_folders', 'directus_migrations', 'directus_permissions', 'directus_presets',
			'directus_relations', 'directus_revisions', 'directus_roles', 'directus_sessions',
			'directus_settings', 'directus_users', 'directus_webhooks', 'directus_flows',
			'directus_operations', 'directus_panels', 'directus_notifications', 'directus_shares',
			'directus_translations', 'directus_versions', 'directus_policies', 'directus_access_tokens',
			'directus_refresh_tokens', 'directus_extensions', 'directus_dashboards', 'directus_comments'
		];

		const isSystemCollection = (collection: any): boolean => {
			const collectionName = collection.collection;
			
			// Method 1: Check explicit system collection list
			if (systemCollections.includes(collectionName)) {
				return true;
			}
			
			// Method 2: All collections starting with 'directus_' are system collections
			if (collectionName.startsWith('directus_')) {
				return true;
			}
			
			// Method 3: Check for typical system collection patterns
			const systemPatterns = [
				/^directus_/i,           // All directus_ prefixed collections
				/^system_/i,             // Some implementations use system_ prefix
				/^_/,                    // Collections starting with underscore
			];
			
			const matchesSystemPattern = systemPatterns.some(pattern => pattern.test(collectionName));
			if (matchesSystemPattern) {
				return true;
			}
			
			// Method 4: Check meta.group for system collections
			if (collection.meta?.group === 'system' || collection.meta?.group === 'directus') {
				return true;
			}
			
			return false;
		};

		const isUserCollection = (collection: any): boolean => {
			// First check if it's a system collection
			if (isSystemCollection(collection)) {
				return false;
			}
			
			// Skip hidden collections
			if (collection.meta?.hidden === true) {
				return false;
			}
			
			// Skip collections without proper schema (might be junction tables)
			if (!collection.schema?.name) {
				return false;
			}
			
			return true;
		};
		
		// Filter out system collections and format for display
		availableCollections.value = collections
			.filter(isUserCollection)
			.map((collection: any) => ({
				name: collection.collection,
				label: collection.meta?.name || collection.collection
			}))
			.sort((a: any, b: any) => a.label.localeCompare(b.label));
		
		console.log('Filtered collections:', availableCollections.value.length, 'user collections found');
		console.log('Available collections:', availableCollections.value);
		console.log('Collection options for dropdown:', collectionOptions.value);
	} catch (error: any) {
		console.error('Failed to load collections:', error);
		availableCollections.value = [];
	} finally {
		loadingCollections.value = false;
	}
};

const createNewFlow = async () => {
	const name = prompt('Enter flow name:');
	if (!name) return;

	try {
		const newFlow = {
			name,
			description: '',
			nodes: [],
			edges: [],
			status: 'draft'
		};

		const response = await api.post('/items/visual_flows', newFlow);
		const flow = response.data.data as FlowData;

		flows.value.push(flow);
		loadFlow(flow.id!);
	} catch (error: any) {
		console.error('Failed to create flow:', error);
	}
};

const onFlowSelect = (flowId: string) => {
	if (flowId) {
		loadFlow(flowId);
	} else {
		currentFlow.value = null;
		selectedNode.value = null;
		nodes.value = [];
		edges.value = [];
	}
};

const loadFlow = (flowId: string) => {
	const flow = flows.value.find(f => f.id === flowId);
	if (flow) {
		currentFlow.value = flow;
		selectedFlowId.value = flowId;

		// Load nodes and edges into Vue Flow
		nodes.value = flow.nodes || [];
		edges.value = flow.edges || [];
	}
};

const saveFlow = async () => {
	if (!currentFlow.value) return;

	saving.value = true;
	try {
		// Update the current flow with current nodes and edges
		currentFlow.value.nodes = nodes.value;
		currentFlow.value.edges = edges.value;

		await api.patch(`/items/visual_flows/${currentFlow.value.id}`, {
			nodes: nodes.value,
			edges: edges.value,
		});
	} catch (error) {
		console.error('Failed to save flow:', error);
	} finally {
		saving.value = false;
	}
};

// Flow renaming functionality
const startRenaming = () => {
	if (!currentFlow.value) return;
	
	renamingFlow.value = true;
	tempFlowName.value = currentFlow.value.name;
	
	// Focus the input after Vue updates the DOM
	nextTick(() => {
		if (flowNameInput.value) {
			const inputElement = flowNameInput.value as any;
			const input = inputElement.$el?.querySelector('input') || inputElement;
			if (input && input.focus) {
				input.focus();
				if (input.select) input.select();
			}
		}
	});
};

const saveFlowName = async () => {
	if (!currentFlow.value || !tempFlowName.value.trim()) return;

	const newName = tempFlowName.value.trim();
	const oldName = currentFlow.value.name;

	try {
		// Update the flow name in the database
		await api.patch(`/items/visual_flows/${currentFlow.value.id}`, {
			name: newName
		});

		// Update local state
		currentFlow.value.name = newName;
		
		// Update the flow in the flows array
		const flowIndex = flows.value.findIndex(f => f.id === currentFlow.value!.id);
		if (flowIndex !== -1 && flows.value[flowIndex]) {
			flows.value[flowIndex].name = newName;
		}

		console.log(`Flow renamed from "${oldName}" to "${newName}"`);
		
		// Exit rename mode
		renamingFlow.value = false;
		tempFlowName.value = '';
	} catch (error) {
		console.error('Failed to rename flow:', error);
		// Reset to original name on error
		tempFlowName.value = oldName;
	}
};

const cancelRenaming = () => {
	renamingFlow.value = false;
	tempFlowName.value = '';
};

// Flow deletion functionality
const deleteFlow = async () => {
	if (!currentFlow.value) return;

	const confirmed = confirm(`Are you sure you want to delete the flow "${currentFlow.value.name}"? This action cannot be undone.`);
	if (!confirmed) return;

	try {
		// Delete from database
		await api.delete(`/items/visual_flows/${currentFlow.value.id}`);

		// Remove from local flows array
		const flowIndex = flows.value.findIndex(f => f.id === currentFlow.value!.id);
		if (flowIndex !== -1) {
			flows.value.splice(flowIndex, 1);
		}

		// Clear current flow and UI state
		currentFlow.value = null;
		selectedFlowId.value = null;
		selectedNode.value = null;
		nodes.value = [];
		edges.value = [];

		console.log('Flow deleted successfully');
	} catch (error) {
		console.error('Failed to delete flow:', error);
	}
};

// Drag and Drop functionality
const onDragStart = (event: DragEvent, nodeType: { type: string; label: string }) => {
	if (!currentFlow.value) {
		event.preventDefault();
		return;
	}

	if (event.dataTransfer) {
		event.dataTransfer.setData('application/vueflow', nodeType.type);
		event.dataTransfer.effectAllowed = 'move';
	}
};

const onDragOver = (event: DragEvent) => {
	event.preventDefault();

	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move';
	}
};

const onDrop = (event: DragEvent) => {
	event.preventDefault();

	if (!currentFlow.value) return;

	const type = event.dataTransfer?.getData('application/vueflow');
	if (!type) return;

	// Get position relative to the Vue Flow canvas
	const flowElement = document.querySelector('.vue-flow__pane');
	if (!flowElement) return;

	const rect = flowElement.getBoundingClientRect();
	const position = {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};

	// Create new node
	const newNode: Node = {
		id: `${type}-${Date.now()}`,
		type: type,
		position: position,
		data: {
			label: getNodeLabel(type),
			description: '',
			// Initialize specific data based on node type
			...getNodeSpecificData(type)
		},
	};

	// Add node to the array
	nodes.value.push(newNode);
};

// Helper function to get node label based on type
const getNodeLabel = (type: string): string => {
	switch (type) {
		case 'flow-link-phase':
			return 'Phase Link';
		case 'flow-link-global':
			return 'Global End';
		default:
			return `${type.charAt(0).toUpperCase() + type.slice(1)} Node`;
	}
};

// Helper function to get node-specific initial data
const getNodeSpecificData = (type: string): any => {
	switch (type) {
		case 'process':
			return { collections: [] };
		case 'flow-link-phase':
			return { 
				terminationType: 'phase',
				linkedFlowId: '',
				linkedFlowName: ''
			};
		case 'flow-link-global':
			return { 
				terminationType: 'global'
			};
		default:
			return {};
	}
};

// Event handlers
const onNodeClick = ({ node }: { node: Node }) => {
	selectedNode.value = node;
};

const onEdgeClick = ({ edge }: { edge: Edge }) => {
	console.log('Edge clicked:', edge);
};

const onConnect = (connection: Connection) => {
	const newEdge: Edge = {
		id: `edge-${Date.now()}`,
		source: connection.source,
		target: connection.target,
		sourceHandle: connection.sourceHandle,
		targetHandle: connection.targetHandle,
	};

	edges.value.push(newEdge);
};

const onEdgeUpdate = ({ edge, connection }: { edge: Edge; connection: Connection }) => {
	console.log('Edge update requested:', { oldEdge: edge, newConnection: connection });
	
	if (!connection) {
		console.error('No connection provided for edge update');
		return;
	}
	
	// Manual edge update - remove old edge and add new one
	try {
		const edgeIndex = edges.value.findIndex(e => e.id === edge.id);
		if (edgeIndex !== -1) {
			// Remove old edge
			edges.value.splice(edgeIndex, 1);
			
			// Add new edge with updated connection
			const newEdge: Edge = {
				...edge,
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
			};
			
			edges.value.push(newEdge);
			console.log('Edge updated successfully:', newEdge);
		}
	} catch (error) {
		console.error('Failed to update edge:', error);
	}
};

// Use the composable event handler as an alternative
onEdgeUpdateEvent((params) => {
	console.log('Edge update event via composable:', params);
	
	// Extract edge and connection from the event parameters
	const edge = params.edge;
	const connection = params.connection;
	
	if (!connection) {
		console.error('No new connection provided in composable event');
		return;
	}
	
	// Manually update the edge
	const edgeIndex = edges.value.findIndex(e => e.id === edge.id);
	if (edgeIndex !== -1) {
		// Remove old edge
		edges.value.splice(edgeIndex, 1);
		
		// Add new edge with updated connection
		const newEdge: Edge = {
			...edge,
			source: connection.source,
			target: connection.target,
			sourceHandle: connection.sourceHandle,
			targetHandle: connection.targetHandle,
		};
		
		edges.value.push(newEdge);
		console.log('Edge reconnected via composable:', newEdge);
	}
});

const onEdgeUpdateStart = (edgeMouseEvent: any) => {
	console.log('Edge update started:', edgeMouseEvent.edge);
};

// Update node data when user edits properties
const updateNodeData = () => {
	if (!selectedNode.value) return;

	console.log('Updating node data:', selectedNode.value.id, selectedNode.value.data);

	// Find and update the node in the nodes array
	const nodeIndex = nodes.value.findIndex(n => n.id === selectedNode.value!.id);
	if (nodeIndex !== -1) {
		nodes.value[nodeIndex] = { ...selectedNode.value };
		console.log('Node updated in array:', nodes.value[nodeIndex]);
	}
};

// Collection management methods for process nodes
const addCollection = () => {
	if (!selectedNode.value || selectedNode.value.type !== 'process') return;

	console.log('Adding collection to node:', selectedNode.value.id);

	// Initialize collections array if it doesn't exist
	if (!selectedNode.value.data.collections) {
		selectedNode.value.data.collections = [];
	}

	// Add new empty collection
	selectedNode.value.data.collections.push({
		name: '',
		label: '',
		url: '',
		openMode: 'tab' // Default to tab mode
	});

	console.log('Collections after adding:', selectedNode.value.data.collections);
	updateNodeData();
};

const removeCollection = (index: number) => {
	if (!selectedNode.value || selectedNode.value.type !== 'process') return;
	if (!selectedNode.value.data.collections) return;

	selectedNode.value.data.collections.splice(index, 1);
	updateNodeData();
};

// Flow link management methods
const onFlowLinkChange = (flowId: string) => {
	if (!selectedNode.value || selectedNode.value.type !== 'flow-link-phase') return;

	console.log('Flow link changed to:', flowId);
	
	// Update the linked flow ID
	selectedNode.value.data.linkedFlowId = flowId;
	
	// Auto-populate the display name if not already set
	if (flowId && !selectedNode.value.data.linkedFlowName) {
		const linkedFlow = flows.value.find(f => f.id === flowId);
		if (linkedFlow) {
			selectedNode.value.data.linkedFlowName = linkedFlow.name;
		}
	}
	
	updateNodeData();
};

const getFlowNameById = (flowId: string): string => {
	const flow = flows.value.find(f => f.id === flowId);
	return flow ? flow.name : 'Unknown Flow';
};

// Router navigation methods
const navigateToCollection = (collection: string, mode: 'create' | 'edit' = 'create', itemId?: string | number) => {
	console.log('Navigating to collection via browser navigation:', collection, mode, itemId);
	
	// Store current flow context in session storage for return navigation
	if (currentFlow.value) {
		sessionStorage.setItem('visualFlowBuilder_returnContext', JSON.stringify({
			flowId: currentFlow.value.id,
			selectedNodeId: selectedNode.value?.id
		}));
	}
	
	// Navigate using browser location instead of router
	let targetPath: string;
	
	if (mode === 'create') {
		targetPath = `/admin/content/${collection}/+`;
	} else if (mode === 'edit' && itemId) {
		targetPath = `/admin/content/${collection}/${itemId}`;
	} else {
		// Fallback to collection overview
		targetPath = `/admin/content/${collection}`;
	}
	
	console.log('Browser navigation to:', targetPath);
	
	// Use window.location to navigate within the same origin
	window.location.href = targetPath;
};

const handleReturnFromCollection = () => {
	console.log('Handling return from collection');
	
	// Restore flow context if available
	const returnContext = sessionStorage.getItem('visualFlowBuilder_returnContext');
	if (returnContext) {
		try {
			const context = JSON.parse(returnContext);
			console.log('Restoring flow context:', context);
			
			// Load the flow if it's different from current
			if (context.flowId && context.flowId !== currentFlow.value?.id) {
				loadFlow(context.flowId);
			}
			
			// Restore selected node if available
			if (context.selectedNodeId) {
				const node = nodes.value.find(n => n.id === context.selectedNodeId);
				if (node) {
					selectedNode.value = node;
				}
			}
			
			// Clear the stored context
			sessionStorage.removeItem('visualFlowBuilder_returnContext');
		} catch (error) {
			console.error('Failed to restore flow context:', error);
		}
	}
};

// Handle events and lifecycle
onMounted(() => {
	// Load initial data
	loadFlows();
	loadCollections();
	
	// Check if we're returning from a collection form
	handleReturnFromCollection();
	
	// Listen for flow navigation events
	window.addEventListener('navigate-to-flow', (event: any) => {
		const { flowId } = event.detail;
		console.log('Navigate to flow requested:', flowId);
		
		// Load the target flow
		if (flowId && flowId !== currentFlow.value?.id) {
			loadFlow(flowId);
		}
	});
	
	// Listen for collection navigation events (using router instead of modal)
	window.addEventListener('open-collection-form', (event: any) => {
		const { collection, mode = 'create', itemId } = event.detail;
		console.log('Collection navigation requested:', collection, mode, itemId);
		navigateToCollection(collection, mode, itemId);
	});
	
	// Keep the old modal event for backward compatibility if needed
	window.addEventListener('open-collection-modal', (event: any) => {
		const { collection, mode = 'create', itemId } = event.detail;
		console.log('Collection modal requested (redirecting to router):', collection, mode, itemId);
		navigateToCollection(collection, mode, itemId);
	});
});
</script>

<style>
/* Import Vue Flow styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/background/dist/style.css';

.visual-flow-builder {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--theme--background-page);
	color: var(--theme--foreground);
}

.header-controls {
	padding: 16px;
	border-bottom: 1px solid var(--theme--border-color-subdued);
	background: var(--theme--background);
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.flow-selector {
	display: flex;
	align-items: center;
	gap: 12px;
}

.flow-details {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
}

.flow-name-section {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.flow-name-display {
	display: flex;
	align-items: center;
	gap: 8px;
}

.flow-title {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.flow-name-edit {
	display: flex;
	align-items: center;
	gap: 8px;
	max-width: 400px;
}

.flow-name-edit .v-input {
	flex: 1;
}

.rename-actions {
	display: flex;
	gap: 4px;
}

.flow-description {
	margin: 0;
	font-size: 14px;
	color: var(--theme--foreground-subdued);
	line-height: 1.4;
}

.flow-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.no-flow-alert {
	padding: 16px;
	margin: 16px;
}

.layout-container {
	flex: 1;
	display: flex;
	height: calc(100vh - 140px);
}

.node-palette {
	width: 280px;
	background: var(--theme--background);
	border-right: 1px solid var(--theme--border-color-subdued);
	padding: 16px;
	overflow-y: auto;
}

.node-palette h3 {
	margin: 0 0 16px 0;
	font-size: 16px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.node-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.node-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px;
	border: 2px solid var(--theme--border-color-subdued);
	border-radius: 8px;
	cursor: grab;
	transition: all 0.2s ease;
	background: var(--theme--background-subdued);
}

.node-item:hover {
	border-color: var(--theme--primary);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.node-item:active {
	cursor: grabbing;
	transform: translateY(0);
}

.node-item.terminal {
	border-color: #10b981;
}

.node-item.process {
	border-color: #3b82f6;
}

.node-item.decision {
	border-color: #f59e0b;
}

.node-item.flow-link-phase {
	border-color: #8b5cf6;
}

.node-item.flow-link-global {
	border-color: #ef4444;
}

.node-preview {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 8px;
}

.node-label {
	font-size: 12px;
	font-weight: 500;
	text-align: center;
	color: var(--theme--foreground);
}

.canvas-container {
	flex: 1;
	position: relative;
	background: var(--theme--background-page);
}

.node-details {
	width: 300px;
	background: var(--theme--background);
	border-left: 1px solid var(--theme--border-color-subdued);
	padding: 16px;
	overflow-y: auto;
}

.node-details h3 {
	margin: 0 0 16px 0;
	font-size: 16px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.node-properties {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.property-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.property-group label {
	font-size: 14px;
	font-weight: 500;
	color: var(--theme--foreground);
}

/* Collection management styles */
.collections-manager {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.collection-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.collection-item-edit {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px;
	border: 1px solid var(--theme--border-color-subdued);
	border-radius: 6px;
	background: var(--theme--background-subdued);
}

.collection-item-edit:hover {
	border-color: var(--theme--primary);
}

.collection-item-edit .v-button {
	align-self: flex-end;
	margin-top: 4px;
}

.collection-row {
	display: flex;
	gap: 8px;
	align-items: center;
}

.collection-row .v-select {
	flex: 1;
}

.open-mode-section {
	display: flex;
	flex-direction: column;
	gap: 4px;
	margin-top: 8px;
}

.open-mode-label {
	font-size: 12px;
	font-weight: 500;
	color: var(--theme--foreground);
}

.loading-message, .no-collections-message {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	text-align: center;
	padding: 8px;
}

.flow-link-manager {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.flow-link-info {
	padding: 8px 12px;
	border-radius: 4px;
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color-subdued);
}

.link-status {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: var(--theme--foreground);
	font-weight: 500;
}

.no-link-info {
	padding: 8px 12px;
	border-radius: 4px;
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color-subdued);
	text-align: center;
}

.no-link-text {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

/* Termination info styles */
.termination-info {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.global-termination-display {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	border-radius: 6px;
	background: var(--theme--background-subdued);
	border: 1px solid #ef4444;
	color: #ef4444;
	font-weight: 500;
}

.termination-description {
	margin: 0;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	line-height: 1.4;
	padding: 8px 12px;
	background: var(--theme--background-subdued);
	border-radius: 4px;
}

.no-selection {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100px;
	color: var(--theme--foreground-subdued);
	text-align: center;
}

/* Vue Flow theme integration */
.vue-flow {
	background: var(--theme--background-page);
}

.vue-flow .vue-flow__node {
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color-subdued);
	color: var(--theme--foreground);
}

.vue-flow .vue-flow__node.selected {
	box-shadow: 0 0 0 2px var(--theme--primary);
}

.vue-flow .vue-flow__edge-path {
	stroke: var(--theme--foreground-subdued);
}

.vue-flow .vue-flow__edge.selected .vue-flow__edge-path {
	stroke: var(--theme--primary);
}

.vue-flow .vue-flow__controls {
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color-subdued);
}

.vue-flow .vue-flow__controls button {
	background: var(--theme--background);
	color: var(--theme--foreground);
	border: 1px solid var(--theme--border-color-subdued);
}

.vue-flow .vue-flow__controls button:hover {
	background: var(--theme--background-subdued);
}

/* Background pattern styling */
.vue-flow__background {
	background: var(--theme--background-page);
}

.vue-flow__background .vue-flow__background-pattern {
	fill: var(--theme--border-color-subdued);
	opacity: 0.5;
}
</style>