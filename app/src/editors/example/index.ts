import { defineEditor } from '@directus/extensions';
import ExampleEditor from './example-editor.vue';

export default defineEditor({
	id: 'example-editor',
	name: 'Example Editor',
	icon: 'edit_note',
	description: 'An example custom item editor',
	component: ExampleEditor,
	// Collections: ['posts'], // Uncomment to limit to specific collections
}); 