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
				class="vue-flow-canvas"
				@nodes-initialized="onNodesInitialized"
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
							@click="openWorkflow(workflow.id)"
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
import { ref, onMounted } from 'vue';
import { VueFlow, PanOnScrollMode } from '@vue-flow/core';
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

const props = defineProps<Props>();

// API composable for fetching programs
const api = useApi();

// Programs data
const programs = ref<Array<{ id: string; name: string }>>([]);
const selectedProgram = ref<string | null>(null);

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
	} catch (error) {
		console.error('Error fetching programs:', error);
		programs.value = [];
	}
}

// Handle program selection change
function onProgramChange(programId: string) {
	selectedProgram.value = programId;
	// Here you could filter workflows or update the diagram based on the selected program
	console.log('Selected program:', programId);
}

// Framework phases data
const phases = ref([
	{
		id: 'request',
		title: 'REQUEST SERVICE/REPORT',
		color: '#7c3aed',
		workflows: [
			{ id: 'report-abuse', title: 'REPORT OF ABUSE OR NEGLECT' },
			{ id: 'request-services', title: 'REQUEST FOR SERVICES' },
			{ id: 'referral', title: 'REFERRAL' },
			{ id: 'icwa-inquiry', title: 'ICWA INQUIRY' }
		]
	},
	{
		id: 'evaluate',
		title: 'EVALUATE SERVICE',
		color: '#7c3aed',
		workflows: [
			{ id: 'cps-investigation', title: 'CPS INVESTIGATION' },
			{ id: 'child-removal', title: 'CHILD REMOVAL' },
			{ id: 'court-process', title: 'COURT PROCESS FOR CHILD REMOVAL' },
			{ id: 'screen-evaluate', title: 'SCREEN-EVALUATE REQUEST' },
			{ id: 'icwa-determination', title: 'ICWA DETERMINATION' }
		]
	},
	{
		id: 'provide',
		title: 'PROVIDE SERVICES AND REEVALUATE SERVICES',
		color: '#7c3aed',
		workflows: [
			{ id: 'non-licensed', title: 'NON-LICENSED PLACEMENT' },
			{ id: 'supervision', title: 'SUPERVISION' },
			{ id: 'program-management', title: 'PROGRAM MANAGEMENT' },
			{ id: 'case-management', title: 'CASE MANAGEMENT' },
			{ id: 'provide-reevaluate', title: 'PROVIDE AND RE-EVALUATE SERVICES' },
			{ id: 'placement', title: 'PLACEMENT' },
			{ id: 'critical-incident', title: 'CRITICAL INCIDENT - SV1' },
			{ id: 'home-visit', title: 'HOME VISIT' }
		]
	},
	{
		id: 'end',
		title: 'END OF SERVICES',
		color: '#7c3aed',
		workflows: [
			{ id: 'end-service', title: 'END OF SERVICE' }
		]
	}
]);

// Vue Flow nodes and edges
const flowNodes = ref<Node[]>([
	// Phase nodes - positioned to match the framework diagram
	{
		id: 'request-node',
		type: 'phase',
		position: { x: 80, y: 120 },
		data: { label: 'Request\nService/Report', phase: 'request' }
	},
	{
		id: 'evaluate-node',
		type: 'phase',
		position: { x: 280, y: 120 },
		data: { label: 'Evaluate Service', phase: 'evaluate' }
	},
	{
		id: 'provide-node',
		type: 'phase',
		position: { x: 480, y: 180 },
		data: { label: 'Provide Services', phase: 'provide' }
	},
	{
		id: 'reevaluate-node',
		type: 'phase',
		position: { x: 680, y: 120 },
		data: { label: 'Reevaluate Services', phase: 'reevaluate' }
	},
	{
		id: 'end-node',
		type: 'phase',
		position: { x: 880, y: 280 },
		data: { label: 'End Of Services', phase: 'end' }
	},
	// Decision node
	{
		id: 'decision-node',
		type: 'decision',
		position: { x: 680, y: 320 },
		data: { label: 'Appropriate To\nContinue?', yesLabel: 'Yes', noLabel: 'No' }
	}
]);

const flowEdges = ref<Edge[]>([
	// Main flow arrows
	{ id: 'e1', source: 'request-node', target: 'evaluate-node', type: 'step', sourceHandle: 'right', targetHandle: 'left' },
	{ id: 'e2', source: 'evaluate-node', target: 'provide-node', type: 'step', sourceHandle: 'right', targetHandle: 'left' },
	{ id: 'e3', source: 'provide-node', target: 'reevaluate-node', type: 'step', sourceHandle: 'right', targetHandle: 'left' },
	{ id: 'e4', source: 'reevaluate-node', target: 'decision-node', type: 'step', sourceHandle: 'bottom', targetHandle: 'top' },
	{ id: 'e5', source: 'decision-node', target: 'end-node', type: 'step', sourceHandle: 'right', targetHandle: 'left', label: 'No' },
	// Loop back to provide services
	{ id: 'e6', source: 'decision-node', target: 'provide-node', type: 'step', sourceHandle: 'left', targetHandle: 'bottom', label: 'Yes' }
]);

// Methods
function onNodesInitialized() {
	// Fit view after nodes are initialized
	setTimeout(() => {
		// Optional: Custom positioning logic
	}, 100);
}

function openWorkflow(workflowId: string) {
	// Open the specific workflow in a new tab
	if (props.collection) {
		const workflowUrl = `/admin/content/${props.collection}/${workflowId}`;
		window.open(workflowUrl, '_blank');
	}
}

// Initialize from props
onMounted(() => {
	// Fetch programs on component mount
	fetchPrograms();
	
	if (props.value) {
		if (props.value.nodes) flowNodes.value = props.value.nodes;
		if (props.value.edges) flowEdges.value = props.value.edges;
		if (props.value.phases) phases.value = props.value.phases;
		if (props.value.selectedProgram) selectedProgram.value = props.value.selectedProgram;
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
	grid-template-columns: repeat(4, 1fr);
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
</style>
