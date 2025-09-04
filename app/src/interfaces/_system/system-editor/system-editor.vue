<script setup lang="ts">
import { useExtensionsStore } from '@/stores/extensions';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';

const props = defineProps<{
	value: string | null;
}>();

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const extensionsStore = useExtensionsStore();
const { extensions } = storeToRefs(extensionsStore);

const values = inject('values', ref<Record<string, any>>({}));

const currentCollection = computed(() => {
	return values.value.collection;
});

const items = computed(() => {
	const defaultOption = {
		text: t('interfaces.system-editor.default'),
		value: null,
	};

	const editorOptions = extensions.value
		.filter((extension) => {
			// Only show enabled editor extensions
			return extension.schema?.type === 'editor' && extension.meta?.enabled;
		})
		// Note: Collection-specific filtering could be added here in the future
		// by exposing more extension metadata from the API
		.map((extension) => {
			return {
				text: extension.schema?.name || extension.id,
				value: extension.id,
			};
		});

	return [defaultOption, ...editorOptions];
});
</script>

<template>
	<v-select
		:items="items"
		:model-value="value"
		:placeholder="t('interfaces.system-editor.placeholder')"
		@update:model-value="$emit('input', $event)"
	/>
</template> 