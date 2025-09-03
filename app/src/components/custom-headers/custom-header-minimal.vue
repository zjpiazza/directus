<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	collection: string;
	primaryKey?: string | null;
	title: string;
	hasEdits: boolean;
	saving: boolean;
	isNew: boolean;
	collectionInfo?: any;
	item?: any;
	validationErrors?: any[];
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
});

defineEmits<{
	save: [];
	delete: [];
	archive: [];
	refresh: [];
	'save-as-copy': [];
}>();

const { t } = useI18n();

const saveButtonText = computed(() => {
	return props.isNew ? t('create') : t('save');
});

const collectionDisplayName = computed(() => {
	return props.collectionInfo?.name || props.collection;
});
</script>

<template>
	<div class="custom-header-minimal">
		<div class="header-content">
			<v-button 
				icon 
				rounded 
				secondary 
				:to="`/content/${collection}`"
				class="back-button"
			>
				<v-icon name="arrow_back" />
			</v-button>
			
			<span class="collection-name">{{ collectionDisplayName }}</span>
			
			<v-button
				:loading="saving"
				:disabled="!hasEdits"
				@click="$emit('save')"
				class="save-button"
			>
				{{ saveButtonText }}
			</v-button>
		</div>
	</div>
</template>

<style scoped>
.custom-header-minimal {
	background: var(--theme--background);
	border-bottom: 1px solid var(--theme--border-color);
	padding: 0.75rem 2rem;
}

.header-content {
	display: flex;
	align-items: center;
	gap: 1rem;
	max-width: 100%;
}

.back-button {
	color: var(--theme--foreground-subdued);
	flex-shrink: 0;
}

.collection-name {
	font-size: 1rem;
	font-weight: 500;
	color: var(--theme--foreground);
	flex-grow: 1;
	text-align: center;
}

.save-button {
	background: var(--theme--primary);
	color: white;
	flex-shrink: 0;
	font-size: 0.875rem;
	padding: 0.5rem 1rem;
}
</style>
