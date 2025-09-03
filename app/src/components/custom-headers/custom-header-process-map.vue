<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '@directus/composables';

interface Props {
	collection: string;
	primaryKey?: string | null;
	title: string;
	isNew: boolean;
	collectionInfo?: any;
	item?: any;
	selectedProgram?: string | null;
	programs?: Array<{ id: string; name: string }>;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
	selectedProgram: null,
	programs: () => [],
});

const emit = defineEmits<{
	'program-change': [programId: string];
}>();

const { t } = useI18n();
const api = useApi();

// Program dropdown functionality - use props when available, otherwise fetch
const programs = ref<Array<{ id: string; name: string }>>(props.programs || []);
const selectedProgram = ref<string | null>(props.selectedProgram);

// Breadcrumbs
const breadcrumbs = computed(() => {
	const crumbs: Array<{ name: string; to?: string }> = [
		{
			name: 'Content',
			to: '/content',
		},
		{
			name: props.collectionInfo?.name || props.collection,
			to: `/content/${props.collection}`,
		},
	];

	if (props.isNew) {
		crumbs.push({
			name: t('creating_new_item'),
		});
	}

	return crumbs;
});

// Fetch programs from the API
async function fetchPrograms() {
	try {
		const response = await api.get('/items/programs', {
			params: {
				fields: ['id', 'name'],
				limit: -1,
			},
		});
		programs.value = response.data.data || [];
		
		// Set default program if available
		if (programs.value.length > 0 && !selectedProgram.value && programs.value[0]) {
			selectedProgram.value = String(programs.value[0].id);
		}
	} catch (error) {
		console.error('Error fetching programs:', error);
		programs.value = [];
	}
}

// Handle program selection change
function onProgramChange(programId: string) {
	selectedProgram.value = programId;
	// Emit the change to parent component
	emit('program-change', programId);
}

onMounted(() => {
	// Only fetch programs if not provided via props
	if (!props.programs || props.programs.length === 0) {
		fetchPrograms();
	}
});
</script>

<template>
	<div class="custom-header-process-map">
		<div class="header-top">
			<nav class="breadcrumbs">
				<template v-for="(crumb, index) in breadcrumbs" :key="index">
					<router-link 
						v-if="crumb.to" 
						:to="crumb.to" 
						class="breadcrumb-link"
					>
						{{ crumb.name }}
					</router-link>
					<span v-else class="breadcrumb-current">{{ crumb.name }}</span>
					<v-icon 
						v-if="index < breadcrumbs.length - 1" 
						name="chevron_right" 
						small 
						class="breadcrumb-separator"
					/>
				</template>
			</nav>
		</div>

		<div class="header-main">
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

				<div class="title-section">
					<div class="info-icon">
						<v-icon name="info" />
					</div>
					<h1 class="header-title">Framework (Standard CPS Framework)</h1>
				</div>
			</div>

			<div class="header-center">
				<div class="program-selector">
					<label>Program:</label>
					<v-select
						v-model="selectedProgram"
						:items="programs"
						item-text="name"
						item-value="id"
						placeholder="Select Program"
						@update:model-value="onProgramChange"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-header-process-map {
	background: var(--theme--background);
	border-bottom: 1px solid var(--theme--border-color);
}

.header-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 24px;
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

.breadcrumbs {
	display: flex;
	align-items: center;
	gap: 8px;
}

.breadcrumb-link {
	color: var(--theme--foreground-subdued);
	text-decoration: none;
	font-size: 14px;
}

.breadcrumb-link:hover {
	color: var(--theme--foreground);
}

.breadcrumb-current {
	color: var(--theme--foreground);
	font-size: 14px;
	font-weight: 500;
}

.breadcrumb-separator {
	color: var(--theme--foreground-subdued);
}

.header-main {
	display: flex;
	align-items: center;
	padding: 16px 24px;
	gap: 24px;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 16px;
	flex: 1;
}

.back-button {
	--v-button-background-color: transparent;
	--v-button-color: var(--theme--foreground-subdued);
}

.back-button:hover {
	--v-button-background-color: var(--theme--background-accent);
	--v-button-color: var(--theme--foreground);
}

.title-section {
	display: flex;
	align-items: center;
	gap: 12px;
}

.info-icon {
	background: var(--theme--primary);
	color: var(--theme--primary-foreground);
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.header-title {
	font-size: 20px;
	font-weight: 600;
	color: var(--theme--foreground);
	margin: 0;
}

.header-center {
	display: flex;
	align-items: center;
	gap: 16px;
}

.program-selector {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 200px;
}

.program-selector label {
	font-size: 14px;
	font-weight: 500;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
}

.program-selector .v-select {
	min-width: 150px;
}
</style> 