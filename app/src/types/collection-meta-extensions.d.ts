import type { CollectionMeta } from '@directus/types';

declare module '@directus/types' {
	interface CollectionMeta {
		custom_item_component?: string | null;
		custom_header_component?: string | null;
	}
}
