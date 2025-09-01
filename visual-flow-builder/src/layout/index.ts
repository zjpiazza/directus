import { defineLayout } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';
import LayoutOptions from './options.vue';
import LayoutSidebar from './sidebar.vue';
import LayoutActions from './actions.vue';

export default defineLayout({
	id: 'visual-flow-layout',
	name: 'Visual Flow Builder',
	icon: 'account_tree',
	component: LayoutComponent,
	slots: {
		options: LayoutOptions,
		sidebar: LayoutSidebar,
		actions: LayoutActions,
	},
	setup(props, { emit }) {
		// Setup function for shared reactive state
		return {};
	},
});
