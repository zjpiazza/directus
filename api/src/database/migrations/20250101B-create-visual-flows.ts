import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// Create visual_flows table if it doesn't exist
	const tableExists = await knex.schema.hasTable('visual_flows');

	if (!tableExists) {
		await knex.schema.createTable('visual_flows', (table) => {
			table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
			table.string('name').notNullable();
			table.text('description').nullable();
			table.json('data').nullable(); // Store nodes and edges as JSON
			table.string('status').defaultTo('draft'); // draft, active, archived
			table.uuid('user_created').nullable();
			table.uuid('user_updated').nullable();
			table.timestamp('date_created').defaultTo(knex.fn.now());
			table.timestamp('date_updated').defaultTo(knex.fn.now());

			// Add indexes
			table.index('status');
			table.index('user_created');
			table.index('date_created');
		});
	}

	// Check if collection metadata already exists
	const collectionExists = await knex('directus_collections')
		.where('collection', 'visual_flows')
		.first();

	if (!collectionExists) {
		// Insert collection metadata (simplified - Directus will auto-discover fields)
		await knex('directus_collections').insert({
			collection: 'visual_flows',
			icon: 'account_tree',
			note: 'Visual flow diagrams with nodes and connections',
			display_template: '{{ name }}',
			hidden: false,
			singleton: false,
			accountability: 'all',
			color: '#6644FF',
			sort_field: 'date_created',
			custom_item_component: 'workflows-builder' // Set our custom component
		});
	} else {
		// Update existing collection to use our custom component
		await knex('directus_collections')
			.where('collection', 'visual_flows')
			.update({
				custom_item_component: 'workflows-builder'
			});
	}

}

export async function down(knex: Knex): Promise<void> {
	// Remove collection metadata
	await knex('directus_collections').where('collection', 'visual_flows').del();

	// Drop table
	await knex.schema.dropTableIfExists('visual_flows');
}
