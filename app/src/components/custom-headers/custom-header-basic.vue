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
</script>

<template>
	<div class="custom-header-basic">
		<div class="header-left">
			<v-button 
				icon 
				rounded 
				secondary 
				:to="`/content/${collection}`"
				class="back-button"
			>
				<v-icon name="arrow_back" />
			</v-button>
			<h1 class="header-title">THIS IS MY CUSTOM HEADER</h1>
		</div>

		<div class="header-right">
			<v-button
				:loading="saving"
				:disabled="!hasEdits"
				@click="$emit('save')"
				class="save-button"
			>
				<v-icon name="check" />
				{{ saveButtonText }}
			</v-button>
		</div>
	</div>
</template>

<style scoped>
.custom-header-basic {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 2rem;
	background: var(--theme--background);
	border-bottom: 1px solid var(--theme--border-color);
	min-height: 60px;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.header-title {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--theme--foreground);
	background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.back-button {
	color: var(--theme--foreground-subdued);
}

.save-button {
	background: var(--theme--primary);
	color: white;
}
</style>
