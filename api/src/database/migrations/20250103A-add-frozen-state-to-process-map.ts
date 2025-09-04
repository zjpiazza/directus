import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('process_map', (table) => {
		table.json('frozen_state').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('process_map', (table) => {
		table.dropColumn('frozen_state');
	});
} 