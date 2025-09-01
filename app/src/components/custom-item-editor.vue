<template>
	<div class="custom-item-editor">
		<div class="custom-header">
			<h1>Custom Item Editor for {{ collectionInfo?.name }}</h1>
			<div class="actions">
				<v-button secondary @click="$emit('refresh')">
					<v-icon name="refresh" />
					Refresh
				</v-button>
				<v-button 
					v-if="!isNew" 
					kind="danger" 
					@click="$emit('delete')"
				>
					<v-icon name="delete" />
					Delete
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

		<div class="custom-content">
			<!-- Your custom form layout goes here -->
			<div class="custom-form-section">
				<h2>Basic Information</h2>
				
				<!-- Example: Custom field rendering -->
				<div v-for="field in visibleFields" :key="field.field" class="custom-field">
					<label>{{ field.name || field.field }}</label>
					
					<!-- You can create custom input components or use Directus interfaces -->
					<component
						:is="`interface-${field.meta?.interface || 'input'}`"
						:value="edits[field.field] ?? item?.[field.field]"
						:field="field"
						:collection="collection"
						:primary-key="primaryKey"
						:disabled="!permissions.itemPermissions.updateAllowed"
						@input="updateField(field.field, $event)"
					/>
					
					<!-- Show validation errors -->
					<div v-if="getFieldError(field.field)" class="field-error">
						{{ getFieldError(field.field) }}
					</div>
				</div>
			</div>

			<!-- Custom sections for specific collections -->
			<div v-if="collection === 'your_collection_name'" class="custom-section">
				<h2>Special Section for Your Collection</h2>
				<!-- Add your custom UI here -->
				<div class="custom-widget">
					<p>This is a custom widget that only appears for specific collections!</p>
					<!-- Add charts, custom inputs, file uploads, etc. -->
				</div>
			</div>

			<!-- Show validation errors -->
			<div v-if="validationErrors.length > 0" class="validation-errors">
				<h3>Validation Errors:</h3>
				<ul>
					<li v-for="error in validationErrors" :key="error.field">
						{{ error.field }}: {{ error.message }}
					</li>
				</ul>
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
	archive: [];
	refresh: [];
}>();

// Computed properties
const hasChanges = computed(() => Object.keys(props.edits).length > 0);

const visibleFields = computed(() => {
	return props.fields.filter(field => 
		!field.meta?.hidden && 
		field.meta?.interface !== 'presentation'
	);
});

// Methods
function updateField(fieldKey: string, value: any) {
	const newEdits = { ...props.edits };
	newEdits[fieldKey] = value;
	emit('update:edits', newEdits);
}

function getFieldError(fieldKey: string) {
	const error = props.validationErrors.find(err => err.field === fieldKey);
	return error?.message;
}
</script>

<style scoped>
.custom-item-editor {
	padding: var(--content-padding);
	max-width: 1200px;
	margin: 0 auto;
}

.custom-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--theme--border-color);
}

.custom-header h1 {
	margin: 0;
	color: var(--theme--foreground);
}

.actions {
	display: flex;
	gap: 0.5rem;
}

.custom-content {
	display: grid;
	gap: 2rem;
}

.custom-form-section {
	background: var(--theme--background-subdued);
	padding: 1.5rem;
	border-radius: var(--theme--border-radius);
}

.custom-form-section h2 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
}

.custom-field {
	margin-bottom: 1.5rem;
}

.custom-field label {
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

.custom-section {
	background: var(--theme--background);
	padding: 1.5rem;
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color);
}

.custom-section h2 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
}

.custom-widget {
	padding: 1rem;
	background: var(--theme--background-accent);
	border-radius: var(--theme--border-radius);
}

.validation-errors {
	background: var(--theme--danger-background);
	color: var(--theme--danger);
	padding: 1rem;
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--danger);
}

.validation-errors h3 {
	margin: 0 0 0.5rem 0;
}

.validation-errors ul {
	margin: 0;
	padding-left: 1.5rem;
}
</style>
