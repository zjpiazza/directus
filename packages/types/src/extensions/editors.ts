import type { Component } from 'vue';
import type { Field } from '../fields.js';
import type { Collection } from '../collection.js';
import type { Permission } from '../permissions.js';

export interface EditorExtensionContext {
	collection: Collection;
	isNew: boolean;
	permissions: Permission;
	item?: Record<string, any>;
}

export interface EditorConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;
	component: Component;
	
	// Targeting options
	collections?: string[]; // Specific collections this applies to
	conditions?: (context: EditorExtensionContext) => boolean;
	
	// Extension metadata
	author?: string;
	version?: string;
	
	// Configuration options for admin
	options?: Record<string, any>;
}

// The props that every editor extension component will receive
export interface EditorExtensionProps {
	// Core data
	collection: string;
	primaryKey?: string | null;
	isNew: boolean;
	item?: Record<string, any>;
	edits: Record<string, any>;
	fields: Field[];
	
	// State
	loading: boolean;
	saving: boolean;
	validationErrors: any[];
	currentVersion?: string | null;
	
	// Metadata
	collectionInfo: Collection;
	permissions: Permission;
}

// Events that editor extensions can emit
export interface EditorExtensionEmits {
	'update:edits': [edits: Record<string, any>];
	'save': [];
	'save-and-quit': [];
	'save-and-add-new': [];
	'save-as-copy': [];
	'delete': [];
	'archive': [];
	'refresh': [];
} 