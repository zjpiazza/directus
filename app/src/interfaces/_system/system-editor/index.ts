import { defineInterface } from '@directus/extensions';
import InterfaceSystemEditor from './system-editor.vue';

export default defineInterface({
	id: 'system-editor',
	name: '$t:interfaces.system-editor.editor',
	description: '$t:interfaces.system-editor.description',
	icon: 'edit',
	component: InterfaceSystemEditor,
	types: ['string'],
	system: true,
	options: [],
}); 