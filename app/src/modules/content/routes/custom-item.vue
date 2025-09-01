<script setup lang="ts">
import { useItem } from '@/composables/use-item';
import { useCollection } from '@directus/composables';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

interface Props {
	collection: string;
	primaryKey?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: null,
});

const { t } = useI18n();
const router = useRouter();
const { collection, primaryKey } = toRefs(props);

// Use Directus composables to get all the functionality
const { info: collectionInfo } = useCollection(collection);
const {
	isNew,
	edits,
	hasEdits,
	item,
	permissions,
	saving,
	loading,
	save,
	remove,
	validationErrors,
	refresh,
} = useItem(collection, primaryKey);

const title = computed(() => {
	return isNew.value
		? `Create New ${collectionInfo.value?.name}`
		: `Edit ${collectionInfo.value?.name}`;
});

// Custom save function with navigation
async function saveAndNavigate() {
	try {
		await save();
		router.push(`/content/${collection.value}`);
	} catch (error) {
		// Error handling is done by the save function
	}
}

async function deleteAndNavigate() {
	try {
		await remove();
		router.push(`/content/${collection.value}`);
	} catch (error) {
		// Error handling
	}
}
</script>

<template>
	<div class="custom-item-page">
		<!-- Custom Header -->
		<div class="custom-page-header">
			<div class="header-content">
				<div class="title-section">
					<v-button 
						icon 
						rounded 
						secondary 
						:to="`/content/${collection}`"
						class="back-button"
					>
						<v-icon name="arrow_back" />
					</v-button>
					<h1>{{ title }}</h1>
				</div>
				
				<div class="header-actions">
					<v-button secondary @click="refresh">
						<v-icon name="refresh" />
						Refresh
					</v-button>
					
					<v-button 
						v-if="!isNew" 
						kind="danger" 
						@click="deleteAndNavigate"
					>
						<v-icon name="delete" />
						Delete
					</v-button>
					
					<v-button 
						:loading="saving" 
						:disabled="!hasEdits"
						@click="saveAndNavigate"
					>
						<v-icon name="check" />
						Save & Close
					</v-button>
				</div>
			</div>
		</div>

		<!-- Custom Content Area -->
		<div class="custom-page-content">
			<div class="main-content">
				<!-- Your completely custom UI goes here -->
				<div class="custom-editor-section">
					<h2>Custom Editor Interface</h2>
					<p>This is a completely custom create/edit page!</p>
					
					<!-- Example: Custom layout with tabs -->
					<div class="custom-tabs">
						<div class="tab-content">
							<!-- Render fields however you want -->
							<div class="field-grid">
								<div 
									v-for="field in permissions.itemPermissions.fields" 
									:key="field.field"
									class="custom-field-wrapper"
								>
									<label>{{ field.name || field.field }}</label>
									<component
										:is="`interface-${field.meta?.interface || 'input'}`"
										:value="edits[field.field] ?? item?.[field.field]"
										:field="field"
										:collection="collection"
										:primary-key="primaryKey"
										@input="edits[field.field] = $event"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Custom widgets/sections -->
				<div class="custom-widgets">
					<div class="widget">
						<h3>Custom Widget 1</h3>
						<p>Add charts, custom inputs, file managers, etc.</p>
					</div>
					
					<div class="widget">
						<h3>Custom Widget 2</h3>
						<p>Build any custom functionality you need!</p>
					</div>
				</div>
			</div>

			<!-- Custom Sidebar -->
			<div class="custom-sidebar">
				<div class="sidebar-section">
					<h3>Item Information</h3>
					<div v-if="item">
						<p><strong>ID:</strong> {{ item.id }}</p>
						<p><strong>Created:</strong> {{ item.date_created }}</p>
						<p><strong>Updated:</strong> {{ item.date_updated }}</p>
					</div>
				</div>

				<div class="sidebar-section">
					<h3>Custom Tools</h3>
					<v-button block secondary>Custom Action 1</v-button>
					<v-button block secondary>Custom Action 2</v-button>
				</div>
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
</template>

<style scoped>
.custom-item-page {
	min-height: 100vh;
	background: var(--theme--background);
}

.custom-page-header {
	background: var(--theme--background-accent);
	border-bottom: 1px solid var(--theme--border-color);
	padding: 1rem 2rem;
}

.header-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
	max-width: 1400px;
	margin: 0 auto;
}

.title-section {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.title-section h1 {
	margin: 0;
	color: var(--theme--foreground);
}

.header-actions {
	display: flex;
	gap: 0.5rem;
}

.custom-page-content {
	display: grid;
	grid-template-columns: 1fr 300px;
	gap: 2rem;
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
}

.main-content {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.custom-editor-section {
	background: var(--theme--background-subdued);
	padding: 2rem;
	border-radius: var(--theme--border-radius);
}

.field-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-top: 1rem;
}

.custom-field-wrapper label {
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: var(--theme--foreground);
}

.custom-widgets {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
}

.widget {
	background: var(--theme--background-accent);
	padding: 1.5rem;
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color);
}

.custom-sidebar {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.sidebar-section {
	background: var(--theme--background-subdued);
	padding: 1.5rem;
	border-radius: var(--theme--border-radius);
}

.sidebar-section h3 {
	margin: 0 0 1rem 0;
	color: var(--theme--foreground);
}

.validation-errors {
	background: var(--theme--danger-background);
	color: var(--theme--danger);
	padding: 1rem 2rem;
	border-top: 1px solid var(--theme--danger);
}
</style>
