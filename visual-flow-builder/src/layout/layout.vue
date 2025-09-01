<template>
	<div class="visual-flow-layout">
		<!-- Main Canvas Area -->
		<div class="flow-canvas-container" ref="canvasContainer">
			<!-- Show message if no item selected or creating new -->
			<div v-if="!currentFlowData && !isCreatingNew" class="no-selection-message">
				<div class="message-content">
					<v-icon name="account_tree" large />
					<h3>Select a flow to edit</h3>
					<p>Choose a flow from the list or create a new one to start building your workflow.</p>
				</div>
			</div>

			<!-- Vue Flow Canvas -->
			<VueFlow
				v-else
				v-model="flowElements"
				:default-zoom="1"
				:min-zoom="0.1"
				:max-zoom="4"
				:snap-to-grid="snapToGrid"
				:snap-grid="[20, 20]"
				:connection-line-type="ConnectionLineType.SmoothStep"
				:default-edge-options="defaultEdgeOptions"
				@node-drag-stop="onNodeDragStop"
				@connect="onConnect"
				@edge-update="onEdgeUpdate"
				@pane-click="onPaneClick"
				@drop="onDrop"
				@dragover="onDragOver"
				class="flow-canvas"
			>
				<Background pattern="dots" :gap="20" />
				<Controls />
				<MiniMap />

				<!-- Custom Node Templates -->
				<template #node-terminal="props">
					<TerminalNode v-bind="props" @update-data="updateNodeData" />
				</template>
				<template #node-process="props">
					<ProcessNode 
						v-bind="props" 
						@update-data="updateNodeData"
						@open-collection-form="handleCollectionNavigation"
					/>
				</template>
				<template #node-decision="props">
					<DecisionNode v-bind="props" @update-data="updateNodeData" />
				</template>
				<template #node-flow-link="props">
					<FlowLinkNode 
						v-bind="props" 
						@update-data="updateNodeData"
						:flows="availableFlows"
					/>
				</template>
			</VueFlow>
		</div>

		<!-- Node Details Panel (will be rendered in sidebar slot) -->
		<div v-if="selectedNode" class="node-details-panel">
			<div class="panel-header">
				<h3>{{ getNodeTypeLabel(selectedNode.type) }} Node</h3>
				<v-button @click="deleteSelectedNode" icon small secondary>
					<v-icon name="delete" />
				</v-button>
			</div>
			
			<div class="panel-content">
				<!-- Terminal Node Details -->
				<div v-if="selectedNode.type === 'terminal'" class="node-form">
					<v-input
						v-model="selectedNode.data.label"
						label="Label"
						@update:model-value="updateNodeData(selectedNode.id, { label: selectedNode.data.label })"
					/>
					<v-select
						v-model="selectedNode.data.terminationType"
						:items="terminationTypes"
						label="Termination Type"
						@update:model-value="updateNodeData(selectedNode.id, { terminationType: selectedNode.data.terminationType })"
					/>
				</div>

				<!-- Process Node Details -->
				<div v-if="selectedNode.type === 'process'" class="node-form">
					<v-input
						v-model="selectedNode.data.label"
						label="Label"
						@update:model-value="updateNodeData(selectedNode.id, { label: selectedNode.data.label })"
					/>
					
					<div class="collections-section">
						<div class="section-header">
							<label>Linked Collections</label>
							<v-button @click="showCollectionModal = true" small>
								Add Collection
							</v-button>
						</div>
						
						<div v-if="selectedNode.data.collections?.length" class="collections-list">
							<div 
								v-for="(collection, index) in selectedNode.data.collections" 
								:key="index"
								class="collection-item"
							>
								<div class="collection-info">
									<span class="collection-name">{{ collection.label || collection.name }}</span>
									<v-badge v-if="collection.openMode" :text="collection.openMode" small />
								</div>
								<v-button 
									@click="removeCollection(index)"
									icon 
									x-small 
									secondary
								>
									<v-icon name="close" />
								</v-button>
							</div>
						</div>
					</div>
				</div>

				<!-- Decision Node Details -->
				<div v-if="selectedNode.type === 'decision'" class="node-form">
					<v-input
						v-model="selectedNode.data.label"
						label="Question/Condition"
						@update:model-value="updateNodeData(selectedNode.id, { label: selectedNode.data.label })"
					/>
				</div>

				<!-- Flow Link Node Details -->
				<div v-if="selectedNode.type === 'flow-link'" class="node-form">
					<v-input
						v-model="selectedNode.data.label"
						label="Label"
						@update:model-value="updateNodeData(selectedNode.id, { label: selectedNode.data.label })"
					/>
					<v-select
						v-model="selectedNode.data.linkedFlowId"
						:items="flowLinkOptions"
						label="Link to Flow"
						@update:model-value="updateNodeData(selectedNode.id, { linkedFlowId: selectedNode.data.linkedFlowId })"
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Collection Selection Modal -->
	<v-dialog v-model="showCollectionModal" :max-width="600">
		<v-card>
			<v-card-title>Add Collection Link</v-card-title>
			<v-card-text>
				<v-select
					v-model="selectedCollection"
					:items="collectionOptions"
					label="Select Collection"
					:loading="loadingCollections"
				/>
				<v-input
					v-if="selectedCollection"
					v-model="collectionLabel"
					label="Display Label (optional)"
					:placeholder="selectedCollection"
				/>
				<v-select
					v-if="selectedCollection"
					v-model="collectionOpenMode"
					:items="openModeOptions"
					label="Open Mode"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-button @click="showCollectionModal = false" secondary>Cancel</v-button>
				<v-button @click="addCollection" :disabled="!selectedCollection">Add</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { 
	VueFlow, 
	ConnectionLineType,
	type Node,
	type Edge,
	type Connection
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';

// Import your existing node components
import TerminalNode from '../module/components/TerminalNode.vue';
import ProcessNode from '../module/components/ProcessNode.vue';
import DecisionNode from '../module/components/DecisionNode.vue';
import FlowLinkNode from '../module/components/FlowLinkNode.vue';

// Props from Directus layout system
interface Props {
	collection: string;
	selection: string[];
	layoutOptions: Record<string, any>;
	layoutQuery: Record<string, any>;
	filter: Record<string, any>;
	filterUser: Record<string, any>;
	filterSystem: Record<string, any>;
	search: string;
	selectMode: boolean;
	readonly: boolean;
	resetPreset: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	'update:selection': [selection: string[]];
	'update:layoutQuery': [query: Record<string, any>];
}>();

// Reactive state
const canvasContainer = ref<HTMLElement>();
const flowElements = ref<(Node | Edge)[]>([]);
const selectedNode = ref<Node | null>(null);
const snapToGrid = ref(true);
const showCollectionModal = ref(false);
const selectedCollection = ref('');
const collectionLabel = ref('');
const collectionOpenMode = ref('new_tab');
const loadingCollections = ref(false);
const availableFlows = ref<any[]>([]);

// API and stores
const api = useApi();
const { useNotificationsStore } = useStores();
const { add: notify } = useNotificationsStore();

// Current flow data from the selected item
const currentFlowData = computed(() => {
	if (props.selection.length === 1) {
		// Load flow data for the selected item
		// This would come from the collection item
		return null; // Placeholder - implement loading logic
	}
	return null;
});

const isCreatingNew = computed(() => {
	return props.selectMode && props.selection.length === 0;
});

// Node type options
const terminationTypes = [
	{ text: 'Global End', value: 'global' },
	{ text: 'Phase End', value: 'phase' }
];

const openModeOptions = [
	{ text: 'New Tab', value: 'new_tab' },
	{ text: 'Modal', value: 'modal' }
];

// Collections
const collectionOptions = ref<any[]>([]);

// Default edge options
const defaultEdgeOptions = {
	type: 'smoothstep',
	markerEnd: 'arrowclosed',
	style: { strokeWidth: 2 }
};

// Methods
const updateNodeData = (nodeId: string, newData: Record<string, any>) => {
	const nodeIndex = flowElements.value.findIndex(el => el.id === nodeId);
	if (nodeIndex !== -1) {
		const node = flowElements.value[nodeIndex] as Node;
		node.data = { ...node.data, ...newData };
		saveFlowData();
	}
};

const onNodeDragStop = () => {
	saveFlowData();
};

const onConnect = (connection: Connection) => {
	const newEdge: Edge = {
		id: `edge-${connection.source}-${connection.target}`,
		source: connection.source!,
		target: connection.target!,
		sourceHandle: connection.sourceHandle,
		targetHandle: connection.targetHandle,
		...defaultEdgeOptions
	};
	flowElements.value.push(newEdge);
	saveFlowData();
};

const onEdgeUpdate = ({ edge, connection }: { edge: Edge; connection: Connection }) => {
	const edgeIndex = flowElements.value.findIndex(el => el.id === edge.id);
	if (edgeIndex !== -1) {
		flowElements.value[edgeIndex] = { ...edge, ...connection };
		saveFlowData();
	}
};

const onPaneClick = () => {
	selectedNode.value = null;
};

const onDrop = (event: DragEvent) => {
	event.preventDefault();
	
	if (!canvasContainer.value) return;
	
	const nodeType = event.dataTransfer?.getData('application/node-type');
	if (!nodeType) return;
	
	const rect = canvasContainer.value.getBoundingClientRect();
	const position = {
		x: event.clientX - rect.left - 150,
		y: event.clientY - rect.top - 50
	};
	
	addNode(nodeType, position);
};

const onDragOver = (event: DragEvent) => {
	event.preventDefault();
	event.dataTransfer!.dropEffect = 'move';
};

const addNode = (type: string, position: { x: number; y: number }) => {
	const nodeId = `${type}-${Date.now()}`;
	const newNode: Node = {
		id: nodeId,
		type,
		position,
		data: getDefaultNodeData(type)
	};
	
	flowElements.value.push(newNode);
	saveFlowData();
};

const getDefaultNodeData = (type: string) => {
	switch (type) {
		case 'terminal':
			return { label: 'Start/End', terminationType: 'global' };
		case 'process':
			return { label: 'Process', collections: [] };
		case 'decision':
			return { label: 'Decision?' };
		case 'flow-link':
			return { label: 'Flow Link', linkedFlowId: null };
		default:
			return { label: 'Node' };
	}
};

const deleteSelectedNode = () => {
	if (selectedNode.value) {
		// Remove the node and any connected edges
		flowElements.value = flowElements.value.filter(el => {
			if ('id' in el && el.id === selectedNode.value!.id) {
				return false; // Remove the node
			}
			if ('source' in el && (el.source === selectedNode.value!.id || el.target === selectedNode.value!.id)) {
				return false; // Remove connected edges
			}
			return true;
		});
		selectedNode.value = null;
		saveFlowData();
	}
};

const saveFlowData = () => {
	// Save the flow data to the collection item
	// This would emit an update event to Directus
	const flowData = {
		nodes: flowElements.value.filter(el => 'type' in el),
		edges: flowElements.value.filter(el => 'source' in el)
	};
	
	// Emit update to parent - this would save to the collection
	console.log('Saving flow data:', flowData);
};

const loadCollections = async () => {
	loadingCollections.value = true;
	try {
		const response = await api.get('/collections');
		collectionOptions.value = response.data.data
			.filter((collection: any) => !collection.collection.startsWith('directus_'))
			.map((collection: any) => ({
				text: collection.collection,
				value: collection.collection
			}));
	} catch (error) {
		notify({
			type: 'error',
			title: 'Error loading collections'
		});
	} finally {
		loadingCollections.value = false;
	}
};

const addCollection = () => {
	if (selectedNode.value && selectedCollection.value) {
		const collections = selectedNode.value.data.collections || [];
		collections.push({
			name: selectedCollection.value,
			label: collectionLabel.value || selectedCollection.value,
			openMode: collectionOpenMode.value
		});
		
		updateNodeData(selectedNode.value.id, { collections });
		
		// Reset modal
		showCollectionModal.value = false;
		selectedCollection.value = '';
		collectionLabel.value = '';
		collectionOpenMode.value = 'new_tab';
	}
};

const removeCollection = (index: number) => {
	if (selectedNode.value?.data.collections) {
		const collections = [...selectedNode.value.data.collections];
		collections.splice(index, 1);
		updateNodeData(selectedNode.value.id, { collections });
	}
};

const handleCollectionNavigation = (data: any) => {
	// Handle navigation to collection forms
	const baseUrl = window.location.origin;
	const url = `${baseUrl}/admin/content/${data.collection}`;
	window.open(url, '_blank');
};

const getNodeTypeLabel = (type: string) => {
	const labels: Record<string, string> = {
		terminal: 'Terminal',
		process: 'Process',
		decision: 'Decision',
		'flow-link': 'Flow Link'
	};
	return labels[type] || type;
};

// Computed properties
const flowLinkOptions = computed(() => {
	return availableFlows.value.map(flow => ({
		text: flow.name,
		value: flow.id
	}));
});

// Lifecycle
onMounted(() => {
	loadCollections();
	// Load flow data if editing existing item
	if (currentFlowData.value) {
		// Load existing flow data
	}
});

// Watch for selection changes
watch(() => props.selection, (newSelection) => {
	if (newSelection.length === 1) {
		// Load flow data for selected item
		// This would fetch the flow data from the collection
	} else {
		// Clear or reset for new item
		flowElements.value = [];
		selectedNode.value = null;
	}
}, { immediate: true });
</script>

<style scoped>
.visual-flow-layout {
	display: flex;
	height: 100%;
	width: 100%;
}

.flow-canvas-container {
	flex: 1;
	position: relative;
	background: var(--background-page);
}

.no-selection-message {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	width: 100%;
}

.message-content {
	text-align: center;
	color: var(--foreground-subdued);
}

.message-content .v-icon {
	margin-bottom: 16px;
	color: var(--foreground-subdued);
}

.flow-canvas {
	height: 100%;
	width: 100%;
}

.node-details-panel {
	width: 300px;
	background: var(--background-normal);
	border-left: var(--border-width) solid var(--border-normal);
	padding: 16px;
}

.panel-header {
	display: flex;
	justify-content: between;
	align-items: center;
	margin-bottom: 16px;
}

.panel-header h3 {
	margin: 0;
	flex: 1;
}

.node-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.collections-section {
	margin-top: 16px;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.collections-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.collection-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px;
	background: var(--background-subdued);
	border-radius: var(--border-radius);
}

.collection-info {
	display: flex;
	align-items: center;
	gap: 8px;
}

.collection-name {
	font-weight: 500;
}
</style>
