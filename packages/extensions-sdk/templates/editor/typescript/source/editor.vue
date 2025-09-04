<template>
	<div class="custom-editor">
		<div class="editor-header">
			<h2>{{ isNew ? 'Create' : 'Edit' }} {{ collectionInfo.collection }}</h2>
			
			<div class="editor-actions">
				<v-button @click="$emit('save')" :loading="saving" :disabled="!hasChanges">
					Save
				</v-button>
				<v-button @click="$emit('save-and-quit')" secondary :disabled="!hasChanges">
					Save & Close
				</v-button>
			</div>
		</div>

		<!-- Custom form implementation -->
		<div class="editor-content">
			<div v-for="field in fields" :key="field.field" class="field-wrapper">
				<label>{{ field.name || field.field }}</label>
				<v-input
					v-model="localEdits[field.field]"
					:field="field"
					:disabled="!(permissions as any).updateAllowed"
				/>
			</div>
		</div>

		<!-- Validation errors -->
		<div v-if="validationErrors.length" class="validation-errors">
			<v-notice type="danger">
				<ul>
					<li v-for="error in validationErrors" :key="error.field">
						{{ error.message }}
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

const localEdits = computed({
	get: () => props.edits,
	set: (value) => emit('update:edits', value)
});

const hasChanges = computed(() => {
	return Object.keys(props.edits).length > 0;
});
</script>

<style scoped>
.custom-editor {
	padding: 20px;
}

.editor-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

.editor-actions {
	display: flex;
	gap: 8px;
}

.editor-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.field-wrapper {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.field-wrapper label {
	font-weight: 500;
	color: var(--theme--foreground);
}

.validation-errors {
	margin-top: 20px;
}
</style> 