import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'visual-flow-interface',
	name: 'Visual Flow Builder',
	icon: 'account_tree',
	description: 'A visual flow builder using Vue Flow for creating and editing workflow diagrams',
	component: InterfaceComponent,
	types: ['json'],
	group: 'relational',
	options: [
		{
			field: 'height',
			name: 'Interface Height',
			type: 'integer',
			meta: {
				interface: 'input',
				options: {
					placeholder: '600',
				},
				width: 'half',
			},
			schema: {
				default_value: 600,
			},
		},
		{
			field: 'enable_snap_to_grid',
			name: 'Enable Snap to Grid',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				options: {
					label: 'Enable snap to grid functionality',
				},
				width: 'half',
			},
			schema: {
				default_value: true,
			},
		},
	],
});
