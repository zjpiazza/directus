<template>
	<div class="example-editor">
		<div class="example-header">
			<h2>📝 Example Custom Editor</h2>
			<p>This is a demonstration of the new editor extension type!</p>
			
			<div class="editor-actions">
				<v-button @click="$emit('save')" :loading="saving" :disabled="!hasChanges">
					<v-icon name="save" />
					Save
				</v-button>
				<v-button @click="$emit('save-and-quit')" secondary :disabled="!hasChanges">
					<v-icon name="check" />
					Save & Close
				</v-button>
			</div>
		</div>

		<div class="editor-content">
			<div class="info-section">
				<h3>📊 Item Information</h3>
				<div class="info-grid">
					<div><strong>Collection:</strong> {{ collection }}</div>
					<div><strong>Primary Key:</strong> {{ primaryKey || 'New Item' }}</div>
					<div><strong>Status:</strong> {{ isNew ? 'Creating' : 'Editing' }}</div>
					<div><strong>Loading:</strong> {{ loading ? 'Yes' : 'No' }}</div>
				</div>
			</div>

			<div class="fields-section">
				<h3>🏗️ Field Editor</h3>
				<div class="field-list">
					<div v-for="field in fields" :key="field.field" class="field-item">
						<div class="field-header">
							<strong>{{ field.name || field.field }}</strong>
							<small>({{ field.type }})</small>
						</div>
						<div class="field-value">
							<code>{{ displayValue(field.field) }}</code>
						</div>
					</div>
				</div>
			</div>

			<div class="demo-section">
				<h3>✨ Custom Features</h3>
				<p>This is where you'd add your custom editing interface - forms, visualizations, workflows, etc.</p>
				
				<div class="demo-controls">
					<v-button @click="addSampleData" secondary>
						<v-icon name="add_circle" />
						Add Sample Data
					</v-button>
					<v-button @click="clearChanges" secondary>
						<v-icon name="clear" />
						Clear Changes
					</v-button>
				</div>
			</div>
		</div>

		<!-- Validation errors -->
		<div v-if="validationErrors.length" class="validation-section">
			<v-notice type="danger">
				<div class="validation-title">
					<v-icon name="warning" />
					Validation Errors
				</div>
				<ul>
					<li v-for="error in validationErrors" :key="error.field">
						<strong>{{ error.field }}:</strong> {{ error.message }}
					</li>
				</ul>
			</v-notice>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { EditorExtensionProps, EditorExtensionEmits } from '@directus/types';
import { computed } from 'vue';

const props = defineProps<EditorExtensionProps>();
const emit = defineEmits<EditorExtensionEmits>();

const hasChanges = computed(() => {
	return Object.keys(props.edits).length > 0;
});

function displayValue(fieldKey: string) {
	const value = props.edits[fieldKey] ?? props.item?.[fieldKey];
	if (value === null || value === undefined) return 'null';
	if (typeof value === 'string') return `"${value}"`;
	return JSON.stringify(value);
}

function addSampleData() {
	const sampleField = props.fields.find(f => f.type === 'string');
	if (sampleField) {
		emit('update:edits', {
			...props.edits,
			[sampleField.field]: 'Sample data from custom editor!'
		});
	}
}

function clearChanges() {
	emit('update:edits', {});
}
</script>

<style scoped>
.example-editor {
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
}

.example-header {
	background: var(--theme--background-subdued);
	padding: 20px;
	border-radius: 8px;
	margin-bottom: 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 16px;
}

.example-header h2 {
	margin: 0;
	color: var(--theme--primary);
}

.example-header p {
	margin: 4px 0 0 0;
	color: var(--theme--foreground-subdued);
}

.editor-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

.editor-content {
	display: grid;
	gap: 24px;
	grid-template-columns: 1fr 1fr;
}

@media (max-width: 768px) {
	.editor-content {
		grid-template-columns: 1fr;
	}
}

.info-section,
.fields-section,
.demo-section {
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color-subdued);
	border-radius: 8px;
	padding: 20px;
}

.demo-section {
	grid-column: 1 / -1;
}

.info-section h3,
.fields-section h3,
.demo-section h3 {
	margin-top: 0;
	margin-bottom: 16px;
	color: var(--theme--foreground);
}

.info-grid {
	display: grid;
	gap: 8px;
	grid-template-columns: 1fr 1fr;
}

.field-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	max-height: 300px;
	overflow-y: auto;
}

.field-item {
	padding: 12px;
	background: var(--theme--background-subdued);
	border-radius: 4px;
}

.field-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.field-header small {
	color: var(--theme--foreground-subdued);
	text-transform: uppercase;
	font-size: 10px;
}

.field-value code {
	background: var(--theme--background-normal);
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 12px;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.demo-controls {
	display: flex;
	gap: 12px;
	margin-top: 16px;
}

.validation-section {
	margin-top: 24px;
}

.validation-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	margin-bottom: 8px;
}

.validation-section ul {
	margin: 0;
	padding-left: 20px;
}
</style> 