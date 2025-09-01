<template>
	<div class="custom-tabbed-editor">
		<div class="editor-header">
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

		<div class="tabs-container">
			<div class="tab-nav">
				<button 
					v-for="tab in tabs" 
					:key="tab.id"
					:class="['tab-button', { active: activeTab === tab.id }]"
					@click="activeTab = tab.id"
				>
					<v-icon :name="tab.icon" />
					{{ tab.name }}
					<span v-if="getTabErrorCount(tab.id) > 0" class="error-badge">
						{{ getTabErrorCount(tab.id) }}
					</span>
				</button>
			</div>

			<div class="tab-content">
				<!-- Basic Info Tab -->
				<div v-if="activeTab === 'basic'" class="tab-panel">
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

				<!-- Relations Tab -->
				<div v-if="activeTab === 'relations'" class="tab-panel">
					<h3>Relations & References</h3>
					<div class="field-grid">
						<div 
							v-for="field in relationFields" 
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

				<!-- Metadata Tab -->
				<div v-if="activeTab === 'metadata'" class="tab-panel">
					<h3>Metadata & System Fields</h3>
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

				<!-- Custom Tab -->
				<div v-if="activeTab === 'custom'" class="tab-panel">
					<h3>Custom Tools & Actions</h3>
					<div class="custom-tools">
						<div class="tool-section">
							<h4>Quick Actions</h4>
							<div class="action-buttons">
								<v-button block secondary @click="duplicateItem">
									<v-icon name="content_copy" />
									Duplicate Item
								</v-button>
								<v-button v-if="!isNew" block kind="danger" @click="$emit('delete')">
									<v-icon name="delete" />
									Delete Item
								</v-button>
							</div>
						</div>

						<div class="tool-section">
							<h4>Item Information</h4>
							<div class="info-grid">
								<div class="info-item">
									<strong>Status:</strong> {{ isNew ? 'New' : 'Existing' }}
								</div>
								<div v-if="item?.id" class="info-item">
									<strong>ID:</strong> {{ item.id }}
								</div>
								<div v-if="item?.date_created" class="info-item">
									<strong>Created:</strong> {{ formatDate(item.date_created) }}
								</div>
								<div v-if="item?.date_updated" class="info-item">
									<strong>Updated:</strong> {{ formatDate(item.date_updated) }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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

const activeTab = ref('basic');

const tabs = [
	{ id: 'basic', name: 'Basic', icon: 'edit' },
	{ id: 'relations', name: 'Relations', icon: 'link' },
	{ id: 'metadata', name: 'Metadata', icon: 'info' },
	{ id: 'custom', name: 'Tools', icon: 'build' },
];

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
		field.field !== 'id' &&
		!field.schema?.is_primary_key &&
		field.type !== 'uuid'
	);
});

const relationFields = computed(() => {
	return visibleFields.value.filter(field => 
		field.type === 'uuid' && !field.schema?.is_primary_key
	);
});

const metaFields = computed(() => {
	return visibleFields.value.filter(field => 
		field.field.startsWith('date_') || 
		field.field.includes('meta') ||
		field.field === 'id' ||
		field.schema?.is_primary_key
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

function getTabErrorCount(tabId: string) {
	let fields: Field[] = [];
	
	switch (tabId) {
		case 'basic':
			fields = basicFields.value;
			break;
		case 'relations':
			fields = relationFields.value;
			break;
		case 'metadata':
			fields = metaFields.value;
			break;
	}
	
	return fields.filter(field => getFieldError(field.field)).length;
}

function formatDate(date: string) {
	return new Date(date).toLocaleString();
}

function duplicateItem() {
	// Emit a custom event or implement duplication logic
	console.log('Duplicate item functionality');
}
</script>

<style scoped>
.custom-tabbed-editor {
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
}

.editor-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--theme--border-color);
}

.editor-header h1 {
	margin: 0;
	color: var(--theme--foreground);
}

.header-actions {
	display: flex;
	gap: 0.5rem;
}

.tabs-container {
	background: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	overflow: hidden;
}

.tab-nav {
	display: flex;
	background: var(--theme--background-accent);
	border-bottom: 1px solid var(--theme--border-color);
}

.tab-button {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem 1.5rem;
	background: none;
	border: none;
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	transition: all 0.2s;
	position: relative;
}

.tab-button:hover {
	background: var(--theme--background-normal);
	color: var(--theme--foreground);
}

.tab-button.active {
	background: var(--theme--background-subdued);
	color: var(--theme--foreground);
	border-bottom: 2px solid var(--theme--primary);
}

.error-badge {
	background: var(--theme--danger);
	color: white;
	border-radius: 50%;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: bold;
}

.tab-content {
	padding: 2rem;
}

.tab-panel h3 {
	margin: 0 0 1.5rem 0;
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

.custom-tools {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
}

.tool-section {
	background: var(--theme--background-normal);
	padding: 1.5rem;
	border-radius: var(--theme--border-radius);
}

.tool-section h4 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
}

.action-buttons {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.info-grid {
	display: grid;
	gap: 0.5rem;
}

.info-item {
	padding: 0.5rem;
	background: var(--theme--background-accent);
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground-subdued);
}
</style>
