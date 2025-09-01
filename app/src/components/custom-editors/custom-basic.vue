<template>
	<div class="custom-basic-editor">
		<div class="editor-header">
			<h2>Basic Custom Editor</h2>
			<p>Collection: {{ collectionInfo?.name }}</p>
		</div>

		<div class="form-grid">
			<div 
				v-for="field in visibleFields" 
				:key="field.field"
				class="field-wrapper"
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

		<div class="actions">
			<v-button secondary @click="$emit('refresh')">
				<v-icon name="refresh" />
				Refresh
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
	refresh: [];
}>();

const hasChanges = computed(() => Object.keys(props.edits).length > 0);

const visibleFields = computed(() => {
	return props.fields.filter(field => 
		!field.meta?.hidden && 
		field.meta?.interface !== 'presentation'
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
</script>

<style scoped>
.custom-basic-editor {
	padding: 2rem;
	max-width: 800px;
	margin: 0 auto;
}

.editor-header {
	margin-bottom: 2rem;
	text-align: center;
}

.editor-header h2 {
	margin: 0 0 0.5rem 0;
	color: var(--theme--foreground);
}

.editor-header p {
	margin: 0;
	color: var(--theme--foreground-subdued);
}

.form-grid {
	display: grid;
	gap: 1.5rem;
	margin-bottom: 2rem;
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

.actions {
	display: flex;
	gap: 1rem;
	justify-content: center;
	padding-top: 1rem;
	border-top: 1px solid var(--theme--border-color);
}
</style>
