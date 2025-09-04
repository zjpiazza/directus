import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';

export default defineModule({
	id: 'workflows-builder',
	name: 'Visual Flow Builder',
	icon: 'account_tree',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
		{
			path: '/edit/:id',
			component: ModuleComponent,
			props: true,
		},
		{
			path: '/create',
			component: ModuleComponent,
			props: { mode: 'create' },
		},
	],
});
