<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '@directus/composables';

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
	hasErrors?: boolean;
	archivable?: boolean;
	deletable?: boolean;
	selectedProgram?: string | null;
	programs?: Array<{ id: string; name: string }>;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
	hasErrors: false,
	archivable: false,
	deletable: false,
	selectedProgram: null,
	programs: () => [],
});

const emit = defineEmits<{
	save: [];
	delete: [];
	archive: [];
	refresh: [];
	'save-as-copy': [];
	duplicate: [];
	'toggle-info': [];
	'program-change': [programId: string];
}>();

const { t } = useI18n();
const api = useApi();

// Program dropdown functionality - use props when available, otherwise fetch
const programs = ref<Array<{ id: string; name: string }>>(props.programs || []);
const selectedProgram = ref<string | null>(props.selectedProgram);

const saveButtonText = computed(() => {
	return props.isNew ? t('create') : t('save');
});

const breadcrumbs = computed(() => {
	const crumbs: Array<{ name: string; to?: string }> = [
		{
			name: t('content'),
			to: '/content',
		},
		{
			name: props.collectionInfo?.name || props.collection,
			to: `/content/${props.collection}`,
		},
	];

	if (!props.isNew && props.primaryKey) {
		crumbs.push({
			name: props.title || props.primaryKey,
		});
	} else if (props.isNew) {
		crumbs.push({
			name: t('creating_new_item'),
		});
	}

	return crumbs;
});

const statusIndicator = computed(() => {
	if (props.hasErrors) return { type: 'error', text: t('validation_errors') };
	if (props.hasEdits) return { type: 'warning', text: t('unsaved_changes') };
	if (props.saving) return { type: 'info', text: t('saving') };
	return { type: 'success', text: t('saved') };
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

			<div class="header-actions">
				<v-button 
					icon 
					rounded 
					secondary 
					@click="$emit('refresh')"
					v-tooltip="t('refresh')"
				>
					<v-icon name="refresh" />
				</v-button>

				<v-menu placement="bottom-end">
					<template #activator="{ toggle }">
						<v-button 
							icon 
							rounded 
							secondary 
							@click="toggle"
							v-tooltip="t('more_options')"
						>
							<v-icon name="more_vert" />
						</v-button>
					</template>

					<v-list>
						<v-list-item 
							v-if="!isNew"
							clickable 
							@click="$emit('save-as-copy')"
						>
							<v-list-item-icon>
								<v-icon name="content_copy" />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('save_as_copy') }}
							</v-list-item-content>
						</v-list-item>

						<v-list-item 
							v-if="!isNew"
							clickable 
							@click="$emit('duplicate')"
						>
							<v-list-item-icon>
								<v-icon name="control_point_duplicate" />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('duplicate') }}
							</v-list-item-content>
						</v-list-item>

						<v-divider v-if="!isNew && (archivable || deletable)" />

						<v-list-item 
							v-if="!isNew && archivable"
							clickable 
							@click="$emit('archive')"
						>
							<v-list-item-icon>
								<v-icon name="archive" />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('archive') }}
							</v-list-item-content>
						</v-list-item>

						<v-list-item 
							v-if="!isNew && deletable"
							clickable 
							class="danger"
							@click="$emit('delete')"
						>
							<v-list-item-icon>
								<v-icon name="delete" />
							</v-list-item-icon>
							<v-list-item-content>
								{{ t('delete') }}
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
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
					<div class="status-indicators">
						<v-chip 
							:class="`status-${statusIndicator.type}`"
							small
							class="status-chip"
						>
							<v-icon 
								:name="
									statusIndicator.type === 'error' ? 'error' :
									statusIndicator.type === 'warning' ? 'warning' :
									statusIndicator.type === 'info' ? 'info' : 'check_circle'
								" 
								small 
							/>
							{{ statusIndicator.text }}
						</v-chip>
						
						<v-chip 
							v-if="validationErrors && validationErrors.length > 0"
							class="status-error"
							small
						>
							<v-icon name="error" small />
							{{ t('validation_errors_count', { count: validationErrors.length }) }}
						</v-chip>
					</div>
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

			<div class="header-right">
				<v-button
					secondary
					:disabled="!hasEdits"
					@click="$emit('toggle-info')"
					class="info-button"
				>
					<v-icon name="info" />
					{{ t('info') }}
				</v-button>

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
	</div>
</template>

<style scoped>
.custom-header-process-map {
	background: var(--theme--background);
	border-bottom: 1px solid var(--theme--border-color);
}

.header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.5rem 2rem;
	background: var(--theme--background-subdued);
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

.breadcrumbs {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.875rem;
}

.breadcrumb-link {
	color: var(--theme--primary);
	text-decoration: none;
	transition: color 0.2s;
}

.breadcrumb-link:hover {
	color: var(--theme--primary-accent);
}

.breadcrumb-current {
	color: var(--theme--foreground-subdued);
	font-weight: 500;
}

.breadcrumb-separator {
	color: var(--theme--foreground-subdued);
	margin: 0 0.25rem;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.header-main {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 2rem;
	min-height: 80px;
	background: #7c3aed;
	color: white;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.title-section {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.info-icon {
	background: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
}

.header-title {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: white;
}

.header-center {
	flex: 1;
	display: flex;
	justify-content: center;
	max-width: 400px;
}

.program-selector {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	width: 100%;
}

.program-selector label {
	font-weight: 500;
	white-space: nowrap;
	color: white;
}

.program-selector :deep(.v-select) {
	min-width: 300px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
}

.program-selector :deep(.v-select .v-input) {
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
}

.program-selector :deep(.v-select .v-input::placeholder) {
	color: rgba(255, 255, 255, 0.7);
}

.status-indicators {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.status-chip {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.status-success {
	background: var(--theme--success-25);
	color: var(--theme--success);
}

.status-warning {
	background: var(--theme--warning-25);
	color: var(--theme--warning);
}

.status-error {
	background: var(--theme--danger-25);
	color: var(--theme--danger);
}

.status-info {
	background: var(--theme--primary-25);
	color: var(--theme--primary);
}

.header-right {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.back-button {
	color: rgba(255, 255, 255, 0.8);
}

.back-button:hover {
	color: white;
}

.info-button {
	color: rgba(255, 255, 255, 0.8);
	border-color: rgba(255, 255, 255, 0.3);
}

.info-button:hover {
	color: white;
	border-color: rgba(255, 255, 255, 0.5);
}

.save-button {
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border-color: rgba(255, 255, 255, 0.3);
}

.save-button:hover {
	background: rgba(255, 255, 255, 0.3);
}

.danger {
	color: var(--theme--danger);
}
</style> 