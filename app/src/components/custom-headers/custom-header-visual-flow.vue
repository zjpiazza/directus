<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
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
	// Visual flow specific props
	flowName?: string;
	flowDescription?: string;
	mode?: 'edit' | 'view';
	canEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
	hasErrors: false,
	archivable: false,
	deletable: false,
	flowName: '',
	flowDescription: '',
	mode: 'edit',
	canEdit: true,
});

const emit = defineEmits<{
	save: [];
	delete: [];
	archive: [];
	refresh: [];
	'save-as-copy': [];
	duplicate: [];
	'toggle-info': [];
	'update-flow-name': [name: string];
	'update-flow-description': [description: string];
	'update-mode': [mode: 'edit' | 'view'];
}>();

const { t } = useI18n();
const api = useApi();

// Mode-based behavior
const isEditMode = computed(() => props.mode === 'edit');
const isViewMode = computed(() => props.mode === 'view');

// Available workflows for navigation
const availableWorkflows = ref<Array<{ id: string; name: string }>>([]);
const showWorkflowMenu = ref(false);

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
			name: props.flowName || props.title || props.primaryKey,
		});
	} else if (props.isNew) {
		crumbs.push({
			name: t('creating_new_item'),
		});
	}

	return crumbs;
});

const statusIndicator = computed(() => {
	// Check validation errors first
	if (props.validationErrors && props.validationErrors.length > 0) {
		return { type: 'error', text: t('validation_errors') };
	}
	
	// Check if currently saving
	if (props.saving) {
		return { type: 'info', text: 'Saving...' };
	}
	
	// Check for unsaved changes
	if (props.hasEdits) {
		return { type: 'warning', text: t('unsaved_changes') };
	}
	
	// Default to saved state
	return { type: 'success', text: props.isNew ? 'Ready' : t('saved') };
});

// Fetch available workflows for navigation
async function fetchWorkflows() {
	try {
		// Only fetch workflows if we're not creating a new item
		if (props.primaryKey === '+') {
			availableWorkflows.value = [];
			return;
		}

		const response = await api.get(`/items/${props.collection}`, {
			params: {
				fields: ['id', 'name'],
				filter: {
					id: {
						_neq: props.primaryKey // Exclude current workflow
					}
				},
				limit: 50
			}
		});
		availableWorkflows.value = response.data.data || [];
	} catch (error) {
		console.error('Failed to fetch workflows:', error);
		availableWorkflows.value = [];
	}
}

// Navigate to another workflow
function navigateToWorkflow(workflowId: string) {
	const targetUrl = `/admin/content/${props.collection}/${workflowId}`;
	window.open(targetUrl, '_blank');
}

// Local state for flow name to prevent reactive loops
const localFlowName = ref(props.flowName || '');

// Watch prop changes to update local state
watch(() => props.flowName, (newName) => {
	localFlowName.value = newName || '';
});

// Update flow name
function updateFlowName(name: string) {
	localFlowName.value = name;
	// Only emit if the value actually changed to prevent unnecessary updates
	if (name !== props.flowName) {
		emit('update-flow-name', name);
	}
}

// Toggle between view and edit modes
function toggleMode() {
	if (!props.canEdit) return; // Disabled if user doesn't have edit permissions
	
	const newMode = props.mode === 'edit' ? 'view' : 'edit';
	emit('update-mode', newMode);
}

// Watch for changes in key props to detect navigation needs
watch([() => props.saving, () => props.isNew], 
	([saving, isNew], [prevSaving, prevIsNew]) => {
		// If we just finished saving a new item, we should navigate to the new URL
		if (prevSaving && !saving && prevIsNew && isNew) {
			// The parent component should handle navigation, but we can emit an event if needed
			// For now, let's see if the parent handles it automatically
		}
	}
);

onMounted(() => {
	fetchWorkflows();
});
</script>

<template>
	<div class="custom-header-visual-flow">
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
					v-tooltip="t('refresh_page')"
				>
					<v-icon name="refresh" />
				</v-button>

				<!-- Workflow Navigation Menu -->
				<v-menu v-if="availableWorkflows.length > 0" placement="bottom-end" v-model="showWorkflowMenu">
					<template #activator="{ toggle }">
						<v-button 
							icon 
							rounded 
							secondary 
							@click="toggle"
							v-tooltip="'Browse other workflows'"
						>
							<v-icon name="account_tree" />
						</v-button>
					</template>

					<v-list>
						<v-list-group>
							<template #activator>
								<v-list-item-content>
									<v-icon name="account_tree" class="mr-2" />
									Other Workflows
								</v-list-item-content>
							</template>
							
							<v-list-item 
								v-for="workflow in availableWorkflows.slice(0, 10)" 
								:key="workflow.id"
								clickable 
								@click="navigateToWorkflow(workflow.id)"
							>
								<v-list-item-icon>
									<v-icon name="open_in_new" />
								</v-list-item-icon>
								<v-list-item-content>
									{{ workflow.name || `Workflow ${workflow.id}` }}
								</v-list-item-content>
							</v-list-item>
						</v-list-group>
					</v-list>
				</v-menu>

				<v-menu placement="bottom-end">
					<template #activator="{ toggle }">
						<v-button 
							icon 
							rounded 
							secondary 
							@click="toggle"
							v-tooltip="t('options')"
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

				<div class="flow-icon">
					<v-icon name="account_tree" />
				</div>

				<div class="title-section">
					<div class="flow-title-input">
						<v-input
							:model-value="localFlowName"
							placeholder="Enter flow name..."
							class="flow-name-input"
							:readonly="isViewMode"
							@update:model-value="isEditMode ? updateFlowName : undefined"
						/>
					</div>
					
					<!-- <div class="status-indicators">
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
					</div> -->
				</div>
			</div>

			<div class="header-right">
				<!-- Mode Toggle Switch -->
				<div class="mode-toggle-section">
					<span class="mode-label">{{ isEditMode ? 'Edit' : 'View' }}</span>
					<v-button
						:kind="isEditMode ? 'primary' : 'secondary'"
						:disabled="!canEdit"
						@click="toggleMode"
						class="mode-toggle"
						small
					>
						<v-icon :name="isEditMode ? 'edit' : 'visibility'" />
						{{ isEditMode ? 'View' : 'Edit' }}
					</v-button>
				</div>



				<v-button
					v-if="isEditMode"
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
.custom-header-visual-flow {
	background: var(--theme--background);
	border-bottom: 1px solid var(--theme--border-color);
}

.header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.375rem 1.5rem;
	background: var(--theme--background-subdued);
	border-bottom: 1px solid var(--theme--border-color-subdued);
    block-size: calc(60px + var(--theme--navigation--project--border-width));
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
	padding: 1rem 1.5rem;
	min-height: 70px;
	background: var(--theme--background);
	color: var(--theme--foreground);
	border-bottom: 1px solid var(--theme--border-color);
}

.header-left {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex: 1;
	min-width: 0;
}

.flow-icon {
	background: var(--theme--primary-background);
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.flow-icon .v-icon {
	font-size: 20px;
	color: var(--theme--primary);
}

.title-section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
}

.flow-title-input {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.flow-name-input {
	background: transparent;
	border: none;
	color: var(--theme--foreground);
	font-size: 1.25rem;
	font-weight: 600;
	padding: 0;
	min-height: auto;
	width: 100%;
	max-width: 350px;
}

.flow-name-input :deep(.v-input) {
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color);
	border-radius: 4px;
	color: var(--theme--foreground);
	padding: 0.5rem;
	font-size: 1.25rem;
	font-weight: 600;
}

.flow-name-input :deep(.v-input::placeholder) {
	color: var(--theme--foreground-subdued);
}

.flow-name-input :deep(.v-input:focus) {
	border-color: var(--theme--primary);
	box-shadow: 0 0 0 2px var(--theme--primary-25);
}

.flow-subtitle {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	font-weight: 500;
}

.status-indicators {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.status-chip {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.status-success {
	background: rgba(72, 187, 120, 0.2);
	color: #68d391;
	border-color: #68d391;
}

.status-warning {
	background: rgba(237, 137, 54, 0.2);
	color: #f6ad55;
	border-color: #f6ad55;
}

.status-error {
	background: rgba(245, 101, 101, 0.2);
	color: #fc8181;
	border-color: #fc8181;
}

.status-info {
	background: rgba(99, 179, 237, 0.2);
	color: #90cdf4;
	border-color: #90cdf4;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-shrink: 0;
}

.mode-toggle-section {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.25rem 0.75rem;
	background: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color);
}

.mode-label {
	font-size: 0.875rem;
	color: var(--theme--foreground-subdued);
	font-weight: 500;
	min-width: 30px;
}

.mode-toggle {
	transition: all 0.2s ease;
}

.mode-toggle:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.back-button {
	color: var(--theme--foreground-subdued);
	border-color: var(--theme--border-color);
}

.back-button:hover {
	color: var(--theme--foreground);
	border-color: var(--theme--border-color-accent);
}





.save-button {
	background: var(--theme--primary);
	color: var(--theme--primary-foreground);
	border-color: var(--theme--primary);
}

.save-button:hover {
	background: var(--theme--primary-accent);
}

.save-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.danger {
	color: var(--theme--danger);
}

/* Workflow menu styling */
:deep(.v-list-group .v-list-item) {
	padding-left: 2rem;
}

:deep(.v-list-item-icon) {
	margin-right: 0.5rem;
}
</style> 