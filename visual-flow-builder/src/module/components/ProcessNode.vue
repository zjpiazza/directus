<template>
	<div class="process-node">
		<div class="node-header">
			<v-icon name="settings" class="node-icon" />
			<span class="node-label">{{ data.label }}</span>
		</div>
		<div class="node-content">
			<div class="node-description" v-if="data.description">
				{{ data.description }}
			</div>
			<div class="node-collections" v-if="data.collections && data.collections.length > 0">
				<div 
					v-for="collection in data.collections" 
					:key="collection.name"
					class="collection-item"
					@click="handleCollectionClick(collection)"
				>
					<v-icon name="table_chart" small />
					<span class="collection-name">{{ collection.label || collection.name }}</span>
					<v-icon 
						:name="collection.openMode === 'modal' ? 'open_in_browser' : 'open_in_new'" 
						x-small 
						class="external-icon" 
					/>
				</div>
			</div>
		</div>
		<!-- Connection handles -->
		<Handle type="source" :position="Position.Right" id="source-right" class="handle-right source" />
		<Handle type="target" :position="Position.Left" id="target-left" class="handle-left target" />
		<Handle type="target" :position="Position.Top" id="target-top" class="handle-top target" />
		<Handle type="target" :position="Position.Bottom" id="target-bottom" class="handle-bottom target" />
	</div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
	data: {
		label: string;
		description?: string;
		collection?: string; // Legacy support
		collections?: Array<{
			name: string;
			label?: string;
			url?: string;
			openMode?: 'tab' | 'modal'; // How to open the collection form
		}>;
	};
	selected?: boolean;
}

defineProps<Props>();

// Handle collection click to open form/collection
const handleCollectionClick = (collection: { name: string; label?: string; url?: string; openMode?: 'tab' | 'modal' }) => {
	console.log('Opening collection:', collection);
	
	const openMode = collection.openMode || 'tab'; // Default to tab if not specified
	
	if (collection.url) {
		// Custom URL - always open in new tab
		window.open(collection.url, '_blank');
	} else if (openMode === 'modal') {
		// Use router navigation instead of modal for better integration
		openCollectionWithRouter(collection.name);
	} else {
		// Default to new tab behavior for backward compatibility
		const baseUrl = window.location.origin;
		window.open(`${baseUrl}/admin/content/${collection.name}`, '_blank');
	}
};

// Function to open collection form using Directus router navigation
const openCollectionWithRouter = (collectionName: string) => {
	console.log('Opening collection with router navigation:', collectionName);
	
	// Dispatch custom event to parent component to handle router navigation
	// This will be caught by the main module component
	window.dispatchEvent(new CustomEvent('open-collection-form', {
		detail: { 
			collection: collectionName,
			mode: 'create' // Default to create mode, could be made configurable
		}
	}));
};
</script>

<style scoped>
.process-node {
	min-width: 140px;
	padding: 12px;
	border-radius: 8px;
	background: var(--theme--background);
	border: 2px solid #3b82f6;
	display: flex;
	flex-direction: column;
	gap: 8px;
	position: relative;
}

.node-header {
	display: flex;
	align-items: center;
	gap: 8px;
}

.node-icon {
	color: #3b82f6;
	font-size: 16px;
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
	gap: 4px;
}

.node-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	line-height: 1.4;
}

.node-collections {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-top: 4px;
}

.collection-item {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 8px;
	border-radius: 4px;
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color-subdued);
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 11px;
}

.collection-item:hover {
	background: var(--theme--background-normal);
	border-color: #3b82f6;
	transform: translateY(-1px);
}

.collection-name {
	flex: 1;
	color: var(--theme--foreground);
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.external-icon {
	color: var(--theme--foreground-subdued);
	opacity: 0.7;
	transition: opacity 0.2s ease;
}

.collection-item:hover .external-icon {
	opacity: 1;
	color: #3b82f6;
}

.handle-right,
.handle-left {
	width: 12px;
	height: 12px;
	background: #3b82f6;
	border: 2px solid var(--theme--background);
	border-radius: 50%;
	transition: all 0.2s ease;
	opacity: 0.7;
}

.handle-right:hover,
.handle-left:hover,
.handle-top:hover,
.handle-bottom:hover {
	opacity: 1;
	transform: scale(1.2);
	background: #2563eb;
}

.handle-right {
	position: absolute;
	top: 50%;
	right: -6px;
	transform: translateY(-50%);
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
	left: 50%;
	transform: translateX(-50%);
	background: #3b82f6;
}

.handle-bottom {
	position: absolute;
	bottom: -6px;
	left: 50%;
	transform: translateX(-50%);
	background: #3b82f6;
}

/* Offset target handles to avoid overlap with source handles */
.handle-top.target {
	top: -6px;
	left: 30%;
	background: #2563eb;
	border-color: #1d4ed8;
}

.handle-bottom.target {
	bottom: -6px;
	left: 70%;
	background: #2563eb;
	border-color: #1d4ed8;
}

.process-node.selected {
	border-color: var(--theme--primary);
	box-shadow: 0 0 0 2px var(--theme--primary);
}
</style>
