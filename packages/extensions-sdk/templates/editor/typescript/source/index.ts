import { defineEditor } from '@directus/extensions-sdk';
import EditorComponent from './editor.vue';

export default defineEditor({
	type: 'editor',
	id: 'custom-editor',
	name: 'Custom Editor',
	icon: 'edit',
	description: 'This is my custom item editor!',
	component: EditorComponent,
	collections: [], // Optional: limit to specific collections
	options: null,
}); 