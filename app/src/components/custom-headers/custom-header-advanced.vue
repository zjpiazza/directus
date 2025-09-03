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
	hasErrors?: boolean;
	archivable?: boolean;
	deletable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
	hasErrors: false,
	archivable: false,
	deletable: false,
});

defineEmits<{
	save: [];
	delete: [];
	archive: [];
	refresh: [];
	'save-as-copy': [];
	duplicate: [];
	'toggle-info': [];
}>();

const { t } = useI18n();

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
</script>

<template>
	<div class="custom-header-advanced">
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
					<h1 class="header-title">{{ title }}</h1>
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
.custom-header-advanced {
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
	min-height: 70px;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.title-section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.header-title {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--theme--foreground);
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
	color: var(--theme--foreground-subdued);
}

.info-button {
	color: var(--theme--foreground-subdued);
}

.save-button {
	background: var(--theme--primary);
	color: white;
}

.danger {
	color: var(--theme--danger);
}
</style>
