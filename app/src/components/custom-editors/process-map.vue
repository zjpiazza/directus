<template>
	<div class="process-map-container">
		<!-- Header -->
		<div class="process-map-header">
			<div class="info-icon">
				<v-icon name="info" />
			</div>
			<div class="header-center">
				<h2>Framework (Standard CPS Framework)</h2>
			</div>
			<div class="header-right">
				<div class="program-selector">
					<label>Program:</label>
					<v-select
						v-model="selectedProgram"
						:items="programs"
						item-text="name"
						item-value="id"
						placeholder="Select Program"
						@update:model-value="onProgramChange"
					/>
				</div>
			</div>
		</div>

		<!-- Main Canvas Area -->
		<div class="canvas-container">
			<VueFlow
				v-model:nodes="flowNodes"
				v-model:edges="flowEdges"
				:zoom-on-scroll="true"
				:zoom-on-pinch="true"
				:zoom-on-double-click="false"
				:pan-on-scroll="false"
				:pan-on-scroll-mode="PanOnScrollMode.Free"
				:min-zoom="0.1"
				:max-zoom="4"
				:fit-view-on-init="true"
				:default-edge-options="{ type: 'step', animated: true }"
				:class="['vue-flow-canvas', `zoom-level-${Math.round(currentZoom * 10)}`]"
				@nodes-initialized="onNodesInitialized"
				@move="onViewportMove"
			>
				<!-- Custom Node Templates -->
				<template #node-phase="nodeProps">
					<PhaseNode v-bind="nodeProps" />
				</template>
				<template #node-decision="nodeProps">
					<DecisionNode v-bind="nodeProps" />
				</template>

				<!-- Background -->
				<Background pattern-color="#e5e7eb" :gap="20" />

				<!-- Controls -->
				<Controls />
			</VueFlow>
		</div>

		<!-- Swim Lanes Section -->
		<div class="swim-lanes-container">
			<div v-for="phase in phases" :key="phase.id" class="swim-lane">
				<div class="swim-lane-header" :style="{ backgroundColor: phase.color }">
					<h3>{{ phase.title }}</h3>
				</div>
				<div class="swim-lane-content">
					<div class="workflow-items">
						<div
							v-for="workflow in phase.workflows"
							:key="workflow.id"
							class="workflow-item"
							@click="openWorkflow(workflow.workflowId || workflow.id)"
						>
							<v-icon name="description" size="small" />
							{{ workflow.title }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { VueFlow, PanOnScrollMode, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import type { Node, Edge } from '@vue-flow/core';
import PhaseNode from '../flow-nodes/PhaseNode.vue';
import DecisionNode from '../flow-nodes/DecisionNode.vue';
import { useApi } from '@directus/composables';

interface Props {
	value?: Record<string, any>;
	collection?: string;
	field?: string;
	primaryKey?: string | number;
}

interface WorkflowItem {
	id: string;
	title: string;
	workflowId?: string;
	workflowName?: string;
}

interface Phase {
	id: string;
	title: string;
	color: string;
	workflows: WorkflowItem[];
}

const props = defineProps<Props>();

// API composable for fetching programs
const api = useApi();

// Programs data
const programs = ref<Array<{ id: string; name: string }>>([]);
const selectedProgram = ref<string | null>(null);

// Workflow links data
const workflowLinks = ref<Array<any>>([]);

// Vue Flow viewport reactivity
const { getViewport, onInit } = useVueFlow();
const currentZoom = ref(1);
const viewportScale = computed(() => {
	// Create a responsive scale factor based on viewport zoom and screen size
	const baseScale = Math.min(window.innerWidth / 1200, window.innerHeight / 800);
	return Math.max(0.5, Math.min(2, baseScale * currentZoom.value));
});

// Watch for zoom changes and update node scaling
watch(() => getViewport(), (viewport) => {
	if (viewport) {
		currentZoom.value = viewport.zoom;
	}
}, { deep: true });

onInit(() => {
	// Initialize zoom tracking
	const viewport = getViewport();
	if (viewport) {
		currentZoom.value = viewport.zoom;
	}
});

// Function to fetch programs from the collection
async function fetchPrograms() {
	try {
		const response = await api.get('/items/programs', {
			params: {
				fields: ['id', 'name'],
				limit: -1, // Get all programs
			},
		});
		programs.value = response.data.data || [];
		
		// Set default program if available
		if (programs.value.length > 0 && !selectedProgram.value && programs.value[0]) {
			selectedProgram.value = String(programs.value[0].id);
			await fetchWorkflowLinks();
		}
	} catch (error) {
		console.error('Error fetching programs:', error);
		programs.value = [];
	}
}

// Function to fetch workflow links for the selected program
async function fetchWorkflowLinks() {
	if (!selectedProgram.value) return;
	
	try {
		const response = await api.get('/items/workflow_links', {
			params: {
				fields: ['id', 'program', 'phase', 'label', 'order', 'workflow.id', 'workflow.name'],
				filter: {
					program: { _eq: selectedProgram.value }
				},
				sort: ['order'],
				limit: -1,
			},
		});
		workflowLinks.value = response.data.data || [];
		updatePhasesWithWorkflowLinks();
	} catch (error) {
		console.error('Error fetching workflow links:', error);
		workflowLinks.value = [];
	}
}

// Function to update phases with workflow links from database
function updatePhasesWithWorkflowLinks() {
	// Group workflow links by phase
	const linksByPhase = workflowLinks.value.reduce((acc, link) => {
		if (!acc[link.phase]) {
			acc[link.phase] = [];
		}
		acc[link.phase].push({
			id: link.workflow?.id || link.id,
			title: link.label,
			workflowId: link.workflow?.id,
			workflowName: link.workflow?.name
		});
		return acc;
	}, {} as Record<string, WorkflowItem[]>);

	// Update phases with actual workflow links
	phases.value = [
		{
			id: 'request_service',
			title: 'REQUEST SERVICE/REPORT',
			color: '#7c3aed',
			workflows: linksByPhase.request_service || []
		},
		{
			id: 'evaluate_service',
			title: 'EVALUATE SERVICE',
			color: '#7c3aed',
			workflows: linksByPhase.evaluate_service || []
		},
		{
			id: 'provide_services',
			title: 'PROVIDE SERVICES AND REEVALUATE SERVICES',
			color: '#7c3aed',
			workflows: linksByPhase.provide_services || []
		},
		{
			id: 'end_of_service',
			title: 'END OF SERVICES',
			color: '#7c3aed',
			workflows: linksByPhase.end_of_service || []
		}
	];
}

// Handle program selection change
async function onProgramChange(programId: string) {
	selectedProgram.value = programId;
	await fetchWorkflowLinks();
	console.log('Selected program:', programId);
}

// Framework phases data - will be updated dynamically from workflow_links
const phases = ref<Phase[]>([
	{
		id: 'request_service',
		title: 'REQUEST SERVICE/REPORT',
		color: '#7c3aed',
		workflows: []
	},
	{
		id: 'evaluate_service',
		title: 'EVALUATE SERVICE',
		color: '#7c3aed',
		workflows: []
	},
	{
		id: 'provide_services',
		title: 'PROVIDE SERVICES AND REEVALUATE SERVICES',
		color: '#7c3aed',
		workflows: []
	},
	{
		id: 'end_of_service',
		title: 'END OF SERVICES',
		color: '#7c3aed',
		workflows: []
	}
]);

// Vue Flow nodes and edges
const flowNodes = ref<Node[]>([
	// Phase nodes - positioned with proper spacing: 1/5, 1/5, 2/5, 1/5
	{
		id: 'request-node',
		type: 'phase',
		position: { x: 100, y: 80 },
		data: { label: 'Request\nService/Report', phase: 'request' }
	},
	{
		id: 'evaluate-node',
		type: 'phase',
		position: { x: 300, y: 80 },
		data: { label: 'Evaluate Service', phase: 'evaluate' }
	},
	{
		id: 'provide-node',
		type: 'phase',
		position: { x: 500, y: 80 },
		data: { label: 'Provide Services', phase: 'provide' }
	},
	{
		id: 'reevaluate-node',
		type: 'phase',
		position: { x: 900, y: 80 },
		data: { label: 'Reevaluate Services', phase: 'reevaluate' }
	},
	{
		id: 'end-node',
		type: 'phase',
		position: { x: 1100, y: 200 },
		data: { label: 'End Of Services', phase: 'end' }
	},
	// Decision node
	{
		id: 'decision-node',
		type: 'decision',
		position: { x: 840, y: 200 },
		data: { label: 'Appropriate\nTo\nContinue?', yesLabel: 'Yes', noLabel: 'No' }
	}
]);

const flowEdges = ref<Edge[]>([
	// Main flow arrows - horizontal flow across the top
	{ id: 'e1', source: 'request-node', target: 'evaluate-node', type: 'step', sourceHandle: 'right', targetHandle: 'left', markerEnd: 'arrowclosed' },
	{ id: 'e2', source: 'evaluate-node', target: 'provide-node', type: 'step', sourceHandle: 'right', targetHandle: 'left', markerEnd: 'arrowclosed' },
	{ id: 'e3', source: 'provide-node', target: 'reevaluate-node', type: 'step', sourceHandle: 'right', targetHandle: 'left', markerEnd: 'arrowclosed' },
	// From reevaluate down to decision
	{ id: 'e4', source: 'reevaluate-node', target: 'decision-node', type: 'step', sourceHandle: 'bottom', targetHandle: 'right', markerEnd: 'arrowclosed' },
	// From decision to end (No path)
	{ id: 'e5', source: 'decision-node', target: 'end-node', type: 'step', sourceHandle: 'bottom', targetHandle: 'left', label: 'No', markerEnd: 'arrowclosed' },
	// Loop back from decision to provide services (Yes path)
	{ id: 'e6', source: 'decision-node', target: 'provide-node', type: 'step', sourceHandle: 'left', targetHandle: 'bottom', label: 'Yes', markerEnd: 'arrowclosed' }
]);

// Methods
function onNodesInitialized() {
	// Fit view after nodes are initialized
	setTimeout(() => {
		// Optional: Custom positioning logic
	}, 100);
}

function onViewportMove(event: { flowTransform: { x: number; y: number; zoom: number } }) {
	// Update current zoom when viewport moves
	currentZoom.value = event.flowTransform.zoom;
}

function openWorkflow(workflowId: string) {
	// Open the specific workflow in a new tab
	const workflowUrl = `/admin/content/visual_flows/${workflowId}`;
	window.open(workflowUrl, '_blank');
}

// Initialize from props
onMounted(async () => {
	// Fetch programs on component mount
	await fetchPrograms();
	
	if (props.value) {
		if (props.value.nodes) flowNodes.value = props.value.nodes;
		if (props.value.edges) flowEdges.value = props.value.edges;
		if (props.value.phases) phases.value = props.value.phases;
		if (props.value.selectedProgram) {
			selectedProgram.value = props.value.selectedProgram;
			await fetchWorkflowLinks();
		}
	}
});
</script>

<style scoped>
.process-map-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #f8fafc;
}

.process-map-header {
	display: flex;
	align-items: center;
	padding: 1rem;
	background: #7c3aed;
	color: white;
}

.info-icon {
	background: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
}

.header-center {
	flex: 1;
	display: flex;
	justify-content: center;
}

.header-center h2 {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	text-align: center;
	white-space: nowrap;
}

.header-right {
	flex-shrink: 0;
}

.program-selector {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
}

.program-selector label {
	font-weight: 500;
	white-space: nowrap;
}

.program-selector :deep(.v-select) {
	min-width: 300px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
}

.program-selector :deep(.v-select .v-input) {
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
}

.program-selector :deep(.v-select .v-input::placeholder) {
	color: rgba(255, 255, 255, 0.7);
}

.info-icon {
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	background: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.canvas-container {
	flex: 1;
	height: 60vh;
	position: relative;
	border-bottom: 2px solid #e5e7eb;
}

.vue-flow-canvas {
	width: 100%;
	height: 100%;
}

.swim-lanes-container {
	display: grid;
	grid-template-columns: 1fr 1fr 2fr 1fr;
	height: 40vh;
	background: white;
	border-top: 1px solid #e5e7eb;
}

.swim-lane {
	border-right: 1px solid #e5e7eb;
	display: flex;
	flex-direction: column;
}

.swim-lane:last-child {
	border-right: none;
}

.swim-lane-header {
	padding: 0.75rem;
	color: white;
	font-weight: 600;
	text-align: center;
	font-size: 0.875rem;
	min-height: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.swim-lane-header h3 {
	margin: 0;
	line-height: 1.2;
}

.swim-lane-content {
	flex: 1;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.workflow-items {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.workflow-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	background: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.75rem;
	line-height: 1.2;
	transition: all 0.2s ease;
	color: #7c3aed;
}

.workflow-item:hover {
	background: #ede9fe;
	border-color: #7c3aed;
	transform: translateY(-1px);
	box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
}

/* Vue Flow custom styling */
:deep(.vue-flow) {
	background: #f8fafc;
}

:deep(.vue-flow__background) {
	background: #f8fafc;
}

:deep(.vue-flow__edge-path) {
	stroke: #6b7280;
	stroke-width: 2;
}

:deep(.vue-flow__edge.animated .vue-flow__edge-path) {
	stroke-dasharray: 5;
	animation: dashdraw 0.5s linear infinite;
}

:deep(.vue-flow__edge-label) {
	background: white;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 11px;
	font-weight: 600;
	color: #374151;
}

@keyframes dashdraw {
	to {
		stroke-dashoffset: -10;
	}
}

/* Responsive zoom classes for optimal viewing at different zoom levels */
.vue-flow.zoom-small :deep(.vue-flow__node) {
	transform-origin: center;
}

.vue-flow.zoom-medium :deep(.vue-flow__node) {
	transform-origin: center;
}

.vue-flow.zoom-large :deep(.vue-flow__node) {
	transform-origin: center;
}
</style>
