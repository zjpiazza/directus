<template>
	<div class="custom-advanced-editor">
		<div class="editor-layout">
			<!-- Main Content -->
			<div class="main-content">
				<div class="content-header">
					<h1>{{ isNew ? 'Create' : 'Edit' }} {{ collectionInfo?.name }}</h1>
					<div class="header-actions">
						<v-button secondary @click="$emit('refresh')">
							<v-icon name="refresh" />
						</v-button>
						<v-button 
							:loading="saving" 
							:disabled="!hasChanges"
							@click="$emit('save')"
						>
							<v-icon name="check" />
							Save
						</v-button>
					</div>
				</div>

				<!-- Field Groups -->
				<div class="field-groups">
					<div class="field-group">
						<h3>Basic Information</h3>
						<div class="field-grid">
							<div 
								v-for="field in basicFields" 
								:key="field.field"
								class="field-wrapper"
								:class="field.meta?.width || 'full'"
							>
								<label>{{ field.name || field.field }}</label>
								<component
									:is="`interface-${field.meta?.interface || 'input'}`"
									:value="edits[field.field] ?? item?.[field.field]"
									:field="field"
									:collection="collection"
									:primary-key="primaryKey"
									:disabled="!permissions.itemPermissions.updateAllowed"
									@input="updateField(field.field, $event)"
								/>
								<div v-if="getFieldError(field.field)" class="field-error">
									{{ getFieldError(field.field) }}
								</div>
							</div>
						</div>
					</div>

					<div v-if="metaFields.length > 0" class="field-group">
						<h3>Metadata</h3>
						<div class="field-grid">
							<div 
								v-for="field in metaFields" 
								:key="field.field"
								class="field-wrapper"
								:class="field.meta?.width || 'full'"
							>
								<label>{{ field.name || field.field }}</label>
								<component
									:is="`interface-${field.meta?.interface || 'input'}`"
									:value="edits[field.field] ?? item?.[field.field]"
									:field="field"
									:collection="collection"
									:primary-key="primaryKey"
									:disabled="!permissions.itemPermissions.updateAllowed"
									@input="updateField(field.field, $event)"
								/>
								<div v-if="getFieldError(field.field)" class="field-error">
									{{ getFieldError(field.field) }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="sidebar">
				<div class="sidebar-section">
					<h4>Item Status</h4>
					<div class="status-info">
						<p><strong>Status:</strong> {{ isNew ? 'New' : 'Existing' }}</p>
						<p v-if="item?.id"><strong>ID:</strong> {{ item.id }}</p>
						<p v-if="item?.date_created"><strong>Created:</strong> {{ formatDate(item.date_created) }}</p>
						<p v-if="item?.date_updated"><strong>Updated:</strong> {{ formatDate(item.date_updated) }}</p>
					</div>
				</div>

				<div class="sidebar-section">
					<h4>Quick Actions</h4>
					<div class="quick-actions">
						<v-button block secondary @click="$emit('refresh')">
							<v-icon name="refresh" />
							Refresh Data
						</v-button>
						<v-button v-if="!isNew" block kind="danger" @click="$emit('delete')">
							<v-icon name="delete" />
							Delete Item
						</v-button>
					</div>
				</div>

				<div v-if="validationErrors.length > 0" class="sidebar-section">
					<h4>Validation Errors</h4>
					<div class="validation-list">
						<div v-for="error in validationErrors" :key="error.field" class="validation-item">
							<strong>{{ error.field }}:</strong> {{ error.message }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Field, ValidationError } from '@directus/types';

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
	delete: [];
	refresh: [];
}>();

const hasChanges = computed(() => Object.keys(props.edits).length > 0);

const visibleFields = computed(() => {
	return props.fields.filter(field => 
		!field.meta?.hidden && 
		field.meta?.interface !== 'presentation'
	);
});

const basicFields = computed(() => {
	return visibleFields.value.filter(field => 
		!field.field.startsWith('date_') && 
		!field.field.includes('meta') &&
		field.field !== 'id'
	);
});

const metaFields = computed(() => {
	return visibleFields.value.filter(field => 
		field.field.startsWith('date_') || 
		field.field.includes('meta') ||
		field.field === 'id'
	);
});

function updateField(fieldKey: string, value: any) {
	const newEdits = { ...props.edits };
	newEdits[fieldKey] = value;
	emit('update:edits', newEdits);
}

function getFieldError(fieldKey: string) {
	const error = props.validationErrors.find(err => err.field === fieldKey);
	return error?.message;
}

function formatDate(date: string) {
	return new Date(date).toLocaleString();
}
</script>

<style scoped>
.custom-advanced-editor {
	min-height: 100vh;
	background: var(--theme--background);
}

.editor-layout {
	display: grid;
	grid-template-columns: 1fr 300px;
	gap: 2rem;
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
}

.content-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--theme--border-color);
}

.content-header h1 {
	margin: 0;
	color: var(--theme--foreground);
}

.header-actions {
	display: flex;
	gap: 0.5rem;
}

.field-groups {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.field-group {
	background: var(--theme--background-subdued);
	padding: 1.5rem;
	border-radius: var(--theme--border-radius);
}

.field-group h3 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
}

.field-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
}

.field-wrapper.half {
	grid-column: span 1;
}

.field-wrapper.full {
	grid-column: 1 / -1;
}

.field-wrapper label {
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: var(--theme--foreground);
}

.field-error {
	color: var(--theme--danger);
	font-size: 0.875rem;
	margin-top: 0.25rem;
}

.sidebar {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.sidebar-section {
	background: var(--theme--background-subdued);
	padding: 1rem;
	border-radius: var(--theme--border-radius);
}

.sidebar-section h4 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
}

.status-info p {
	margin: 0.5rem 0;
	color: var(--theme--foreground-subdued);
}

.quick-actions {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.validation-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.validation-item {
	padding: 0.5rem;
	background: var(--theme--danger-background);
	color: var(--theme--danger);
	border-radius: var(--theme--border-radius);
	font-size: 0.875rem;
}
</style>
