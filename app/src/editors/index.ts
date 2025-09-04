import type { EditorConfig } from '@directus/extensions';
import { sortBy } from 'lodash';
import { App } from 'vue';

export function getInternalEditors(): EditorConfig[] {
	const editors = import.meta.glob<EditorConfig>(['./*/index.ts'], {
		import: 'default',
		eager: true,
	});

	return sortBy(Object.values(editors), 'id');
}

export function registerEditors(editors: EditorConfig[], app: App): void {
	for (const editor of editors) {
		app.component(`editor-${editor.id}`, editor.component);

		if (typeof editor.options !== 'function' && Array.isArray(editor.options) === false && editor.options !== null && editor.options !== undefined) {
			app.component(`editor-options-${editor.id}`, editor.options as any);
		}
	}
} 