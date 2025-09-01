<template>
	<private-view title="Visual Flow Builder">
		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button rounded icon secondary disabled>
				<v-icon name="account_tree" />
			</v-button>
		</template>

		<template #actions>
			<template v-if="currentView === 'list'">
				<v-button @click="createNewFlow">
					<v-icon name="add" left />
					New Flow
				</v-button>
			</template>
			
			<template v-if="currentView === 'editor'">
				<v-button @click="saveFlow" :loading="saving">
					<v-icon name="save" left />
					Save
				</v-button>
				
				<v-button @click="clearCanvas" icon rounded v-tooltip="'Clear Canvas'">
					<v-icon name="clear_all" />
				</v-button>
				
				<v-button @click="exitEditor" icon rounded v-tooltip="'Back to List'">
					<v-icon name="arrow_back" />
				</v-button>
			</template>
		</template>

		<div class="flow-builder-content">
			<!-- Flow List View -->
			<div v-if="currentView === 'list'" class="flow-list">
				<div class="flows-grid">
					<div 
						v-for="flow in flows" 
						:key="flow.id"
						class="flow-card"
						@click="editFlow(flow)"
					>
						<div class="flow-card-header">
							<h3>{{ flow.name }}</h3>
							<v-icon name="more_vert" @click.stop="showFlowMenu($event, flow)" />
						</div>
						<p class="flow-description">{{ flow.description || 'No description' }}</p>
						<div class="flow-meta">
							<span>{{ flow.nodes?.length || 0 }} nodes</span>
							<span>Updated {{ formatDate(flow.date_updated) }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Flow Editor -->
			<div v-else-if="currentView === 'editor'" class="flow-editor">
				<!-- Node Palette Sidebar (Left) -->
				<div class="node-palette-sidebar">
					<div class="panel-section">
						<h4>
							<v-icon name="account_tree" left />
							Node Types
						</h4>
						<div class="palette-nodes-vertical">
							<div 
								class="palette-node terminal"
								:draggable="!!currentFlow"
								@dragstart="startDrag($event, 'terminal')"
								@click="addNode('terminal')"
								v-tooltip="'Terminal (Start/End)'"
								:class="{ disabled: !currentFlow }"
							>
								<v-icon name="radio_button_checked" />
								<div class="node-info">
									<span class="node-title">Terminal</span>
									<span class="node-description">Start/End points</span>
								</div>
							</div>
							<div 
								class="palette-node process"
								:draggable="!!currentFlow"
								@dragstart="startDrag($event, 'process')"
								@click="addNode('process')"
								v-tooltip="'Process Node'"
								:class="{ disabled: !currentFlow }"
							>
								<v-icon name="settings" />
								<div class="node-info">
									<span class="node-title">Process</span>
									<span class="node-description">Action or operation</span>
								</div>
							</div>
							<div 
								class="palette-node decision"
								:draggable="!!currentFlow"
								@dragstart="startDrag($event, 'decision')"
								@click="addNode('decision')"
								v-tooltip="'Decision Node'"
								:class="{ disabled: !currentFlow }"
							>
								<v-icon name="help" />
								<div class="node-info">
									<span class="node-title">Decision</span>
									<span class="node-description">Conditional branching</span>
								</div>
							</div>
							<div 
								class="palette-node connector"
								:draggable="!!currentFlow"
								@dragstart="startDrag($event, 'connector')"
								@click="addNode('connector')"
								v-tooltip="'On/Off Page Connector'"
								:class="{ disabled: !currentFlow }"
							>
								<v-icon name="link" />
								<div class="node-info">
									<span class="node-title">Connector</span>
									<span class="node-description">Page connectors</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Main Canvas Area -->
				<div class="canvas-area">
					<!-- Canvas -->
					<div 
						class="canvas-container" 
						ref="canvasContainer"
						@dragover.prevent="handleDragOver"
						@dragleave="handleDragLeave"
						@drop="handleDrop"
					>
						<svg class="flow-canvas" ref="svgCanvas">
							<!-- Grid Pattern -->
							<defs>
								<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
									<path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--theme--border-color-subdued)" stroke-width="1"/>
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill="url(#grid)" />

							<!-- Connections -->
							<g class="connections">
								<path
									v-for="connection in connections"
									:key="connection.id"
									:d="connection.path"
									class="connection-path"
									:class="{ selected: selectedConnection === connection.id }"
									@click="selectConnection(connection.id)"
								/>
							</g>

							<!-- Nodes -->
							<g class="nodes">
								<g
									v-for="node in currentFlow?.nodes || []"
									:key="node.id"
									:transform="`translate(${node.x}, ${node.y})`"
									class="flow-node"
									:class="[node.type, { selected: selectedNode === node.id }]"
									@click="selectNode(node.id)"
									@mousedown="startDragNode(node.id, $event)"
								>
									<component
										:is="getNodeComponent(node.type)"
										:node="node"
										@update="updateNode"
										@connect="startConnection"
									/>
								</g>
							</g>
						</svg>
						
						<!-- Drop Zone Overlay -->
						<div v-if="isDragActive" class="drop-zone-overlay">
							<div class="drop-zone-content">
								<v-icon name="add_circle" size="48" />
								<p v-if="currentFlow">Drop to create {{ draggedNodeType }} node</p>
								<p v-else class="error-text">Please create or edit a flow first</p>
							</div>
						</div>
						
						<!-- Empty Canvas Message -->
						<div v-if="!currentFlow?.nodes?.length && currentFlow" class="empty-canvas-message">
							<v-icon name="account_tree" size="64" />
							<h3>Empty Flow Canvas</h3>
							<p>Drag nodes from the left panel or click the node types to add them to your flow</p>
						</div>
					</div>
				</div>

				<!-- Node Details Panel (Right) -->
				<div class="node-details-panel">
					<div class="panel-section">
						<h4>Node Details</h4>
						<div v-if="selectedNode && selectedNodeData" class="node-form">
							<div class="property-group">
								<label>Node Type:</label>
								<span class="node-type-badge" :class="selectedNodeData.type">{{ selectedNodeData.type }}</span>
							</div>
							<div class="property-group">
								<label>Title:</label>
								<v-input 
									v-model="selectedNodeData.label" 
									@input="updateSelectedNode" 
									placeholder="Enter node title..."
								/>
							</div>
							<div class="property-group">
								<label>Description:</label>
								<v-textarea 
									v-model="selectedNodeData.description" 
									@input="updateSelectedNode" 
									placeholder="Describe what this node does..."
									rows="3"
								/>
							</div>
							<div v-if="selectedNodeData.type === 'process'" class="property-group">
								<label>Link to Collection:</label>
								<v-select
									v-model="selectedNodeData.collection"
									:items="collections"
									item-text="name"
									item-value="collection"
									@update:model-value="updateSelectedNode"
									placeholder="Select a collection..."
								/>
							</div>
							<div v-if="selectedNodeData.type === 'terminal'" class="property-group">
								<label>Terminal Type:</label>
								<v-select
									v-model="selectedNodeData.variant"
									:items="[
										{ text: 'Start', value: 'start' },
										{ text: 'End', value: 'end' }
									]"
									@update:model-value="updateSelectedNode"
								/>
							</div>
							<div v-if="selectedNodeData.type === 'decision'" class="property-group">
								<label>Condition:</label>
								<v-input 
									v-model="selectedNodeData.condition" 
									@input="updateSelectedNode" 
									placeholder="Enter condition logic..."
								/>
							</div>
						</div>
						<div v-else class="no-selection">
							<v-icon name="info" />
							<p>Select a node to edit its properties</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Flow Menu -->
		<v-menu v-model="showMenu" :activator="menuActivator">
			<v-list>
				<v-list-item @click="duplicateFlow(selectedFlow)">
					<v-list-item-icon><v-icon name="content_copy" /></v-list-item-icon>
					<v-list-item-content>Duplicate</v-list-item-content>
				</v-list-item>
				<v-list-item @click="deleteFlow(selectedFlow)" class="danger">
					<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
					<v-list-item-content>Delete</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<!-- Create Flow Dialog -->
		<v-dialog v-model="showCreateDialog">
			<v-card>
				<v-card-title>Create New Flow</v-card-title>
				<v-card-text>
					<div class="create-flow-form">
						<v-input
							v-model="newFlowName"
							label="Flow Name"
							placeholder="Enter flow name..."
						/>
						<v-textarea
							v-model="newFlowDescription"
							label="Description (optional)"
							placeholder="Describe what this flow does..."
						/>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="showCreateDialog = false">Cancel</v-button>
					<v-button @click="createFlow" :disabled="!newFlowName">Create</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';

// Node Components
import TerminalNode from './components/TerminalNode.vue';
import ProcessNode from './components/ProcessNode.vue';
import DecisionNode from './components/DecisionNode.vue';
import ConnectorNode from './components/ConnectorNode.vue';

interface FlowNode {
	id: string;
	type: 'terminal' | 'process' | 'decision' | 'connector';
	x: number;
	y: number;
	label: string;
	description?: string;
	collection?: string;
	variant?: string;
	condition?: string;
}

interface FlowConnection {
	id: string;
	from: string;
	to: string;
	path: string;
}

interface Flow {
	id: string;
	name: string;
	description?: string;
	nodes: FlowNode[];
	connections: FlowConnection[];
	date_created: string;
	date_updated: string;
}

export default defineComponent({
	components: {
		TerminalNode,
		ProcessNode,
		DecisionNode,
		ConnectorNode,
	},
	setup() {
		const api = useApi();
		
		// State
		const currentView = ref<'list' | 'editor'>('list');
		const flows = ref<Flow[]>([]);
		const currentFlow = ref<Flow | null>(null);
		const selectedNode = ref<string | null>(null);
		const selectedConnection = ref<string | null>(null);
		const saving = ref(false);
		const collections = ref([]);
		
		// UI State
		const showCreateDialog = ref(false);
		const newFlowName = ref('');
		const newFlowDescription = ref('');
		const showMenu = ref(false);
		const menuActivator = ref<HTMLElement | null>(null);
		const selectedFlow = ref<Flow | null>(null);
		
		// Canvas state
		const canvasContainer = ref();
		const svgCanvas = ref();
		const dragState = ref<{
			isDragging: boolean;
			nodeId: string | null;
			startX: number;
			startY: number;
		}>({
			isDragging: false,
			nodeId: null,
			startX: 0,
			startY: 0,
		});
		
		 // Drag and drop functionality for palette nodes
		const draggedNodeType = ref<string | null>(null);
		const isDragActive = computed(() => draggedNodeType.value !== null);

		// Computed
		const breadcrumb = computed(() => {
			const items = [{ name: 'Visual Flow Builder', to: '' }];
			if (currentView.value === 'editor' && currentFlow.value) {
				items.push({ name: currentFlow.value.name, to: '' });
			}
			return items;
		});
		
		const selectedNodeData = computed(() => {
			if (!selectedNode.value || !currentFlow.value) return null;
			return currentFlow.value.nodes.find(n => n.id === selectedNode.value);
		});
		
		const connections = computed(() => {
			if (!currentFlow.value) return [];
			return currentFlow.value.connections || [];
		});

		// Methods
		const loadFlows = async () => {
			try {
				const response = await api.get('/items/visual_flows');
				flows.value = response.data.data || [];
			} catch (error: any) {
				console.error('Failed to load flows:', error);
				// If collection doesn't exist, show helpful message
				if (error.response?.status === 404) {
					console.warn('visual_flows collection not found. Please restart Directus to initialize the collection.');
				}
				flows.value = [];
			}
		};

		const loadCollections = async () => {
			try {
				const response = await api.get('/collections');
				collections.value = response.data.data || [];
			} catch (error: any) {
				console.error('Failed to load collections:', error);
			}
		};

		const createNewFlow = () => {
			showCreateDialog.value = true;
		};

		const createFlow = async () => {
			if (!newFlowName.value.trim()) return;
			
			try {
				const newFlow = {
					name: newFlowName.value,
					description: newFlowDescription.value || null,
					nodes: [],
					connections: [],
					status: 'draft'
				};

				const response = await api.post('/items/visual_flows', newFlow);
				const flow = response.data.data as Flow;
				
				flows.value.push(flow);
				editFlow(flow);
				
				showCreateDialog.value = false;
				newFlowName.value = '';
				newFlowDescription.value = '';
			} catch (error: any) {
				console.error('Failed to create flow:', error);
				// You could add a toast notification here
			}
		};

		const editFlow = (flow: Flow) => {
			currentFlow.value = flow;
			currentView.value = 'editor';
		};

		const saveFlow = async () => {
			if (!currentFlow.value) return;
			
			saving.value = true;
			try {
				await api.patch(`/items/visual_flows/${currentFlow.value.id}`, {
					nodes: currentFlow.value.nodes,
					connections: currentFlow.value.connections,
				});
			} catch (error) {
				console.error('Failed to save flow:', error);
			} finally {
				saving.value = false;
			}
		};

		const exitEditor = () => {
			currentView.value = 'list';
			currentFlow.value = null;
			selectedNode.value = null;
			selectedConnection.value = null;
		};

		const addNode = (type: 'terminal' | 'process' | 'decision' | 'connector') => {
			if (!currentFlow.value) return;

			const newNode: FlowNode = {
				id: `node_${Date.now()}`,
				type: type,
				x: 100,
				y: 100,
				label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
			};

			if (type === 'terminal') {
				newNode.variant = 'start';
			}

			currentFlow.value.nodes.push(newNode);
		};

		const selectNode = (nodeId: string) => {
			selectedNode.value = nodeId;
			selectedConnection.value = null;
		};

		const selectConnection = (connectionId: string) => {
			selectedConnection.value = connectionId;
			selectedNode.value = null;
		};

		const updateSelectedNode = () => {
			if (!selectedNodeData.value || !currentFlow.value || !selectedNode.value) return;
			
			const nodeIndex = currentFlow.value.nodes.findIndex(n => n.id === selectedNode.value);
			if (nodeIndex !== -1) {
				const currentNode = currentFlow.value.nodes[nodeIndex];
				if (!currentNode) return;
				
				const updates = selectedNodeData.value;
				
				// Only update defined properties
				if (updates.label !== undefined) currentNode.label = updates.label;
				if (updates.description !== undefined) currentNode.description = updates.description;
				if (updates.collection !== undefined) currentNode.collection = updates.collection;
				if (updates.variant !== undefined) currentNode.variant = updates.variant;
				if (updates.condition !== undefined) currentNode.condition = updates.condition;
			}
		};

		const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
			if (!currentFlow.value) return;
			
			const nodeIndex = currentFlow.value.nodes.findIndex(n => n.id === nodeId);
			if (nodeIndex !== -1) {
				const currentNode = currentFlow.value.nodes[nodeIndex];
				if (!currentNode) return;
				
				// Only update properties that are actually provided
				if (updates.label !== undefined) currentNode.label = updates.label;
				if (updates.description !== undefined) currentNode.description = updates.description;
				if (updates.collection !== undefined) currentNode.collection = updates.collection;
				if (updates.variant !== undefined) currentNode.variant = updates.variant;
				if (updates.condition !== undefined) currentNode.condition = updates.condition;
				if (updates.x !== undefined) currentNode.x = updates.x;
				if (updates.y !== undefined) currentNode.y = updates.y;
				if (updates.type !== undefined) currentNode.type = updates.type;
			}
		};

		const clearCanvas = () => {
			if (!currentFlow.value) return;
			currentFlow.value.nodes = [];
			currentFlow.value.connections = [];
		};

		const getNodeComponent = (type: string) => {
			const components: Record<string, string> = {
				terminal: 'TerminalNode',
				process: 'ProcessNode',
				decision: 'DecisionNode',
				connector: 'ConnectorNode',
			};
			return components[type] || 'TerminalNode';
		};

		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString();
		};

		const showFlowMenu = (event: Event, flow: Flow) => {
			menuActivator.value = event.target as HTMLElement;
			selectedFlow.value = flow;
			showMenu.value = true;
		};

		const duplicateFlow = async (flow: Flow | null) => {
			if (!flow) return;
			// Implementation for duplicating flow
			console.log('Duplicating flow:', flow.name);
			showMenu.value = false;
		};

		const deleteFlow = async (flow: Flow | null) => {
			if (!flow) return;
			// Implementation for deleting flow
			console.log('Deleting flow:', flow.name);
			showMenu.value = false;
		};

		const startDragNode = (nodeId: string, event: MouseEvent) => {
			dragState.value = {
				isDragging: true,
				nodeId: nodeId,
				startX: event.clientX,
				startY: event.clientY,
			};

			const handleMouseMove = (e: MouseEvent) => {
				if (!dragState.value.isDragging || !currentFlow.value) return;

				const deltaX = e.clientX - dragState.value.startX;
				const deltaY = e.clientY - dragState.value.startY;

				const node = currentFlow.value.nodes.find(n => n.id === dragState.value.nodeId);
				if (node) {
					node.x += deltaX;
					node.y += deltaY;
					dragState.value.startX = e.clientX;
					dragState.value.startY = e.clientY;
				}
			};

			const handleMouseUp = () => {
				dragState.value.isDragging = false;
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		const startConnection = (fromNodeId: string, connectionType = 'default') => {
			// Start creating a connection from this node
			// This would be enhanced with visual feedback and connection drawing
			console.log('Starting connection from node:', fromNodeId, 'type:', connectionType);
			
			// For now, we'll implement a simple connection system
			// In a full implementation, this would show a draggable line
			// that follows the mouse until clicking on another node
		};

		const startDrag = (event: DragEvent, nodeType: string) => {
			console.log('Starting drag:', nodeType); // Debug log
			draggedNodeType.value = nodeType;
			if (event.dataTransfer) {
				event.dataTransfer.setData('text/plain', nodeType);
				event.dataTransfer.effectAllowed = 'copy';
				event.dataTransfer.dropEffect = 'copy';
			}
		};

		const handleDragOver = (event: DragEvent) => {
			event.preventDefault();
			event.stopPropagation();
			
			console.log('Drag over canvas'); // Debug log
			console.log('draggedNodeType.value:', draggedNodeType.value); // Debug log
			
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'copy';
			}
			
			// Add visual feedback
			if (canvasContainer.value) {
				canvasContainer.value.classList.add('drag-over');
			}
		};

		const handleDragLeave = (event: DragEvent) => {
			event.preventDefault();
			console.log('Drag leave canvas'); // Debug log
			
			// Remove visual feedback when leaving canvas
			if (canvasContainer.value && !canvasContainer.value.contains(event.relatedTarget as Node)) {
				canvasContainer.value.classList.remove('drag-over');
			}
		};

		const handleDrop = (event: DragEvent) => {
			console.log('Drop event triggered'); // Debug log
			console.log('canvasContainer.value:', canvasContainer.value); // Debug log
			console.log('currentFlow.value:', currentFlow.value); // Debug log
			
			event.preventDefault();
			event.stopPropagation();
			
			// Clear drag state first
			draggedNodeType.value = null;
			
			// Remove visual feedback
			if (canvasContainer.value) {
				canvasContainer.value.classList.remove('drag-over');
			}
			
			if (!currentFlow.value) {
				console.log('No current flow - user needs to create/edit a flow first'); // Debug log
				// Show a helpful message to the user
				alert('Please create or edit a flow first before adding nodes.');
				return;
			}
			
			if (!canvasContainer.value) {
				console.log('Canvas container not found'); // Debug log
				return;
			}
			
			const nodeType = event.dataTransfer?.getData('text/plain');
			console.log('Node type to create:', nodeType); // Debug log
			
			if (!nodeType) {
				console.log('No node type found'); // Debug log
				return;
			}
			
			// Get canvas coordinates relative to the SVG
			const canvasRect = canvasContainer.value.getBoundingClientRect();
			const x = Math.max(10, event.clientX - canvasRect.left);
			const y = Math.max(10, event.clientY - canvasRect.top);
			
			console.log('Drop coordinates:', x, y); // Debug log
			
			// Create new node at drop position
			const newNode: FlowNode = {
				id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				type: nodeType as 'terminal' | 'process' | 'decision' | 'connector',
				x: x,
				y: y,
				label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
			};

			if (nodeType === 'terminal') {
				newNode.variant = 'start';
			}

			currentFlow.value.nodes.push(newNode);
			console.log('Node created successfully:', newNode); // Debug log
			console.log('Total nodes now:', currentFlow.value.nodes.length); // Debug log
		};

		// Lifecycle
		onMounted(() => {
			loadFlows();
			loadCollections();
		});

		return {
			// State
			currentView,
			flows,
			currentFlow,
			selectedNode,
			selectedConnection,
			saving,
			collections,
			
			// UI State
			showCreateDialog,
			newFlowName,
			newFlowDescription,
			showMenu,
			menuActivator,
			selectedFlow,
			
			// Refs
			canvasContainer,
			svgCanvas,
			
			// Computed
			breadcrumb,
			selectedNodeData,
			connections,
			
			// Methods
			createNewFlow,
			createFlow,
			editFlow,
			saveFlow,
			exitEditor,
			addNode,
			selectNode,
			selectConnection,
			updateSelectedNode,
			updateNode,
			clearCanvas,
			getNodeComponent,
			formatDate,
			showFlowMenu,
			duplicateFlow,
			deleteFlow,
			startDragNode,
			startConnection,
			startDrag,
			handleDragOver,
			handleDragLeave,
			handleDrop,
			
			// Drag state
			draggedNodeType,
			isDragActive,
		};
	},
});
</script>

<style scoped>
.flow-builder-content {
	height: 100%;
	display: flex;
	flex-direction: column;
}

/* Flow List Styles */
.flow-list {
	padding: 20px;
}

.flows-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 20px;
}

.flow-card {
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	padding: 16px;
	cursor: pointer;
	transition: all 0.2s ease;
	background: var(--theme--background);
	color: var(--theme--foreground);
}

.flow-card:hover {
	border-color: var(--theme--primary);
	box-shadow: 0 2px 8px var(--theme--shadow);
}

.flow-card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.flow-card-header h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.flow-description {
	color: var(--theme--foreground-subdued);
	font-size: 14px;
	margin-bottom: 12px;
}

.flow-meta {
	display: flex;
	justify-content: space-between;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

/* Flow Editor Styles */
.flow-editor {
	height: 100%;
	display: flex;
}

/* Node Palette Sidebar (Left) */
.node-palette-sidebar {
	width: 280px;
	background: var(--theme--background-page);
	border-right: var(--theme--border-width) solid var(--theme--border-color-subdued);
	overflow-y: auto;
	flex-shrink: 0;
}

/* Canvas Area (Center) */
.canvas-area {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

/* Node Details Panel (Right) */
.node-details-panel {
	width: 300px;
	background: var(--theme--background-page);
	border-left: var(--theme--border-width) solid var(--theme--border-color-subdued);
	overflow-y: auto;
	flex-shrink: 0;
}

/* Shared panel styles */
.panel-section {
	padding: 20px;
}

.panel-section h4 {
	margin: 0 0 16px 0;
	font-size: 16px;
	font-weight: 600;
	color: var(--theme--foreground);
	display: flex;
	align-items: center;
	gap: 8px;
}

/* Node form styles */
.node-form {
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

.node-type-badge {
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	text-transform: capitalize;
}

.node-type-badge.terminal {
	background: #10b981;
	color: white;
}

.node-type-badge.process {
	background: #3b82f6;
	color: white;
}

.node-type-badge.decision {
	background: #f59e0b;
	color: white;
}

.node-type-badge.connector {
	background: #8b5cf6;
	color: white;
}

.no-selection {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 40px 20px;
	text-align: center;
	color: var(--theme--foreground-subdued);
}

/* Palette styles */
.palette-nodes-vertical {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.palette-nodes-vertical .palette-node {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 12px 16px;
	text-align: left;
	width: 100%;
	gap: 12px;
	min-height: 60px;
}

.node-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.node-title {
	font-weight: 600;
	font-size: 14px;
	color: var(--theme--foreground);
}

.node-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

.editor-container {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.editor-toolbar {
	background: var(--theme--background-page);
	border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
	padding: 16px;
}

.node-palette h4 {
	margin: 0 0 12px 0;
	font-size: 14px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.palette-nodes {
	display: flex;
	gap: 12px;
}

.palette-node {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 8px 12px;
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 80px;
	background: var(--theme--background);
	color: var(--theme--foreground);
	user-select: none;
}

.palette-node:hover {
	border-color: var(--theme--primary);
	background: var(--theme--background-subdued);
}

.palette-node:active {
	transform: scale(0.98);
}

.palette-node.disabled {
	opacity: 0.5;
	cursor: not-allowed;
	pointer-events: none;
}

.palette-node span {
	font-size: 12px;
	margin-top: 4px;
}

/* Node type specific colors - adapt to theme */
.palette-node.terminal {
	border-color: #10b981;
}

.palette-node.process {
	border-color: #3b82f6;
}

.palette-node.decision {
	border-color: #f59e0b;
}

.palette-node.connector {
	border-color: #8b5cf6;
}

/* Dark mode adjustments */
:global(body.dark) .palette-node.terminal {
	border-color: #34d399;
}

:global(body.dark) .palette-node.process {
	border-color: #60a5fa;
}

:global(body.dark) .palette-node.decision {
	border-color: #fbbf24;
}

:global(body.dark) .palette-node.connector {
	border-color: #a78bfa;
}

/* Auto dark mode support */
@media (prefers-color-scheme: dark) {
	:global(body:not(.light)) .palette-node.terminal {
		border-color: #34d399;
	}

	:global(body:not(.light)) .palette-node.process {
		border-color: #60a5fa;
	}

	:global(body:not(.light)) .palette-node.decision {
		border-color: #fbbf24;
	}

	:global(body:not(.light)) .palette-node.connector {
		border-color: #a78bfa;
	}
}

/* Canvas Styles */
.canvas-container {
	flex: 1;
	position: relative;
	overflow: hidden;
	background: var(--theme--background-page);
	border: 2px dashed transparent;
	transition: border-color 0.2s ease;
}

.canvas-container.drag-over {
	border-color: var(--theme--primary);
	background: var(--theme--background-subdued);
}

.flow-canvas {
	width: 100%;
	height: 100%;
}

/* Drop Zone Overlay */
.drop-zone-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(var(--theme--primary-rgb), 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	pointer-events: none;
}

.drop-zone-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px;
	background: var(--theme--background);
	border: 2px dashed var(--theme--primary);
	border-radius: var(--theme--border-radius);
	color: var(--theme--primary);
	font-weight: 500;
}

.drop-zone-content .error-text {
	color: var(--theme--danger);
	font-weight: 600;
}

/* Empty Canvas Message */
.empty-canvas-message {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
	color: var(--theme--foreground-subdued);
	z-index: 1;
	pointer-events: none;
}

.empty-canvas-message h3 {
	margin: 16px 0 8px 0;
	font-size: 24px;
	font-weight: 600;
	color: var(--theme--foreground-subdued);
}

.empty-canvas-message p {
	margin: 0;
	font-size: 16px;
	max-width: 400px;
}

/* Grid pattern - adapt to theme */
.flow-canvas defs pattern path {
	stroke: var(--theme--border-color-subdued);
}

.flow-node {
	cursor: pointer;
}

.flow-node.selected {
	filter: drop-shadow(0 0 8px var(--theme--primary));
}

.connection-path {
	stroke: var(--theme--foreground-subdued);
	stroke-width: 2;
	fill: none;
	cursor: pointer;
}

.connection-path:hover,
.connection-path.selected {
	stroke: var(--theme--primary);
	stroke-width: 3;
}

/* Properties Panel */
.properties-panel {
	width: 300px;
	background: var(--theme--background-page);
	border-left: var(--theme--border-width) solid var(--theme--border-color-subdued);
	padding: 20px;
	color: var(--theme--foreground);
}

.properties-panel h4 {
	margin: 0 0 16px 0;
	font-size: 16px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.property-group {
	margin-bottom: 16px;
}

.property-group label {
	display: block;
	font-size: 14px;
	font-weight: 500;
	margin-bottom: 6px;
	color: var(--theme--foreground);
}

/* Create Flow Dialog */
.create-flow-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px 0;
}

/* Menu styles */
.danger {
	color: var(--theme--danger) !important;
}

/* Drag feedback */
.palette-node[draggable="true"]:hover {
	cursor: grab;
}

.palette-node[draggable="true"]:active {
	cursor: grabbing;
}

.palette-node.disabled:hover {
	cursor: not-allowed;
}

/* Enhanced visual feedback for drag operations */
.canvas-container {
	position: relative;
}

/* Remove the old always-present message since we now have conditional messages */

/* Improve accessibility */
.palette-node:focus {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 1024px) {
	.flow-editor {
		flex-direction: column;
	}
	
	.node-palette-sidebar {
		width: 100%;
		max-height: 200px;
		order: 1;
		border-right: none;
		border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
	
	.canvas-area {
		order: 2;
		min-height: 400px;
	}
	
	.node-details-panel {
		width: 100%;
		max-height: 250px;
		order: 3;
		border-left: none;
		border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
	
	.palette-nodes-vertical {
		flex-direction: row;
		flex-wrap: wrap;
	}
	
	.palette-nodes-vertical .palette-node {
		flex: 1;
		min-width: 200px;
	}
}

@media (max-width: 768px) {
	.node-palette-sidebar {
		max-height: 150px;
	}
	
	.node-details-panel {
		max-height: 200px;
	}
	
	.canvas-area {
		min-height: 300px;
	}
	
	.palette-nodes-vertical .palette-node {
		min-width: 150px;
		padding: 8px 12px;
		min-height: 50px;
	}
}
</style>
