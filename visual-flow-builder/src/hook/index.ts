import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ init }, { database, logger }: any) => {
	init('app.before', async () => {
		logger.info('🔧 Visual Flow Builder Hook: Starting collection setup...');
		
		try {
			// Check if visual_flows table exists
			const hasTable = await database.schema.hasTable('visual_flows');
			logger.info(`🔍 Visual Flow Builder Hook: Table exists: ${hasTable}`);
			
			if (!hasTable) {
				logger.info('📝 Visual Flow Builder Hook: Creating visual_flows table...');
				
				// Create the table using Knex
				await database.schema.createTable('visual_flows', (table: any) => {
					table.increments('id').primary();
					table.string('name', 255).notNullable();
					table.text('description').nullable();
					table.json('nodes').nullable();
					table.json('connections').nullable();
					table.json('flow_data').nullable(); // Complete Vue Flow data for layout extension
					table.string('status', 50).defaultTo('draft');
					// Directus standard timestamp fields
					table.timestamp('date_created').defaultTo(database.fn.now());
					table.timestamp('date_updated').defaultTo(database.fn.now());
					table.uuid('user_created').nullable();
					table.uuid('user_updated').nullable();
					// Also add the fields Directus might expect
					table.timestamp('created_at').defaultTo(database.fn.now());
					table.timestamp('updated_at').defaultTo(database.fn.now());
				});
				
				logger.info('✅ Visual Flow Builder Hook: Table created successfully');
				
				// Insert collection metadata into directus_collections
				await database('directus_collections').insert({
					collection: 'visual_flows',
					icon: 'account_tree',
					note: 'Visual flow chart definitions for the flow builder extension',
					display_template: '{{name}}',
					hidden: false,
					singleton: false,
					accountability: 'all',
					color: '#3B82F6',
					item_duplication_fields: null,
					sort: null,
					group: null,
					collapse: 'open',
					preview_url: null,
					versioning: false
				});
				
				logger.info('✅ Visual Flow Builder Hook: Collection metadata inserted');
				
				// Insert field metadata into directus_fields
				const fields = [
					{
						collection: 'visual_flows',
						field: 'id',
						special: null,
						interface: null,
						options: null,
						display: null,
						display_options: null,
						readonly: true,
						hidden: true,
						sort: 1,
						width: 'full',
						translations: null,
						note: 'Primary key',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'name',
						special: null,
						interface: 'input',
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 2,
						width: 'half',
						translations: null,
						note: 'Name of the visual flow',
						conditions: null,
						required: true,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'description',
						special: null,
						interface: 'input-multiline',
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 3,
						width: 'full',
						translations: null,
						note: 'Description of what this flow does',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'nodes',
						special: null,
						interface: 'input-code',
						options: JSON.stringify({ language: 'json', lineNumber: true }),
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 4,
						width: 'full',
						translations: null,
						note: 'JSON array of flow nodes',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'connections',
						special: null,
						interface: 'input-code',
						options: JSON.stringify({ language: 'json', lineNumber: true }),
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 5,
						width: 'full',
						translations: null,
						note: 'JSON array of connections between nodes',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'flow_data',
						special: null,
						interface: 'input-code', // Use JSON code editor for now
						options: JSON.stringify({ language: 'json', lineNumber: true }),
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 6,
						width: 'full',
						translations: null,
						note: 'Complete Vue Flow data for visual editing',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'status',
						special: null,
						interface: 'select-dropdown',
						options: JSON.stringify({
							choices: [
								{ text: 'Draft', value: 'draft' },
								{ text: 'Published', value: 'published' },
								{ text: 'Archived', value: 'archived' }
							]
						}),
						display: 'labels',
						display_options: JSON.stringify({
							choices: [
								{ text: 'Draft', value: 'draft', foreground: '#6B7280', background: '#F3F4F6' },
								{ text: 'Published', value: 'published', foreground: '#059669', background: '#D1FAE5' },
								{ text: 'Archived', value: 'archived', foreground: '#DC2626', background: '#FEE2E2' }
							]
						}),
						readonly: false,
						hidden: false,
						sort: 7,
						width: 'half',
						translations: null,
						note: 'Current status of the flow',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'date_created',
						special: 'date-created',
						interface: 'datetime',
						options: null,
						display: 'datetime',
						display_options: JSON.stringify({ relative: true }),
						readonly: true,
						hidden: true,
						sort: 8,
						width: 'half',
						translations: null,
						note: 'When the flow was created',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'date_updated',
						special: 'date-updated',
						interface: 'datetime',
						options: null,
						display: 'datetime',
						display_options: JSON.stringify({ relative: true }),
						readonly: true,
						hidden: true,
						sort: 9,
						width: 'half',
						translations: null,
						note: 'When the flow was last updated',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'user_created',
						special: 'user-created',
						interface: null,
						options: null,
						display: null,
						display_options: null,
						readonly: true,
						hidden: true,
						sort: 10,
						width: 'half',
						translations: null,
						note: 'User who created the flow',
						conditions: null,
						required: false,
						group: null,
						validation: null
					},
					{
						collection: 'visual_flows',
						field: 'user_updated',
						special: 'user-updated',
						interface: null,
						options: null,
						display: null,
						display_options: null,
						readonly: true,
						hidden: true,
						sort: 11,
						width: 'half',
						translations: null,
						note: 'User who last updated the flow',
						conditions: null,
						required: false,
						group: null,
						validation: null
					}
				];
				
				await database('directus_fields').insert(fields);
				
				logger.info('✅ Visual Flow Builder Hook: Field metadata inserted');
				
				// Add permissions for Administrator role
				const adminRole = await database('directus_roles').where('name', 'Administrator').first();
				
				if (adminRole) {
					logger.info(`🔍 Visual Flow Builder Hook: Found admin role with ID: ${adminRole.id}`);
					
					// Check if permissions already exist and remove them first
					await database('directus_permissions')
						.where({
							role: adminRole.id,
							collection: 'visual_flows'
						})
						.del();
					
					// Insert comprehensive permissions for all CRUD operations
					const permissions = [
						{
							role: adminRole.id,
							collection: 'visual_flows',
							action: 'create',
							permissions: '{}',
							validation: '{}',
							presets: null,
							fields: '*'
						},
						{
							role: adminRole.id,
							collection: 'visual_flows',
							action: 'read',
							permissions: '{}',
							validation: '{}',
							presets: null,
							fields: '*'
						},
						{
							role: adminRole.id,
							collection: 'visual_flows',
							action: 'update',
							permissions: '{}',
							validation: '{}',
							presets: null,
							fields: '*'
						},
						{
							role: adminRole.id,
							collection: 'visual_flows',
							action: 'delete',
							permissions: '{}',
							validation: '{}',
							presets: null,
							fields: '*'
						}
					];
					
					await database('directus_permissions').insert(permissions);
					logger.info('✅ Visual Flow Builder Hook: Added comprehensive permissions for visual_flows collection to Administrator role');
					
					// Verify permissions were created
					const createdPermissions = await database('directus_permissions')
						.where({
							role: adminRole.id,
							collection: 'visual_flows'
						});
					logger.info(`🔍 Visual Flow Builder Hook: Created ${createdPermissions.length} permissions for visual_flows`);
				} else {
					logger.warn('⚠️ Visual Flow Builder Hook: No Administrator role found! This could cause permission issues.');
				}
				
				logger.info('✅ Visual Flow Builder Hook: visual_flows collection created successfully with all metadata and permissions');
			} else {
				logger.info('🔍 Visual Flow Builder Hook: visual_flows table already exists');
				
				// Even if table exists, ensure permissions are set up correctly
				const adminRole = await database('directus_roles').where('name', 'Administrator').first();
				
				if (adminRole) {
					// Check existing permissions
					const existingPermissions = await database('directus_permissions')
						.where({
							role: adminRole.id,
							collection: 'visual_flows'
						});
					
					if (existingPermissions.length === 0) {
						logger.info('🔍 Visual Flow Builder Hook: No permissions found for existing visual_flows collection, adding them...');
						
						const permissions = [
							{
								role: adminRole.id,
								collection: 'visual_flows',
								action: 'create',
								permissions: '{}',
								validation: '{}',
								presets: null,
								fields: '*'
							},
							{
								role: adminRole.id,
								collection: 'visual_flows',
								action: 'read',
								permissions: '{}',
								validation: '{}',
								presets: null,
								fields: '*'
							},
							{
								role: adminRole.id,
								collection: 'visual_flows',
								action: 'update',
								permissions: '{}',
								validation: '{}',
								presets: null,
								fields: '*'
							},
							{
								role: adminRole.id,
								collection: 'visual_flows',
								action: 'delete',
								permissions: '{}',
								validation: '{}',
								presets: null,
								fields: '*'
							}
						];
						
						await database('directus_permissions').insert(permissions);
						logger.info('✅ Visual Flow Builder Hook: Added missing permissions for existing visual_flows collection');
					} else {
						logger.info(`🔍 Visual Flow Builder Hook: Found ${existingPermissions.length} existing permissions for visual_flows`);
					}
				}
			}
			
			logger.info('🎉 Visual Flow Builder Hook: Collection setup completed successfully');
		} catch (error: any) {
			logger.error('❌ Visual Flow Builder Hook: Error setting up visual_flows collection:');
			logger.error('Error type:', typeof error);
			logger.error('Error constructor:', error?.constructor?.name);
			logger.error('Error message:', error?.message);
			logger.error('Error code:', error?.code);
			logger.error('Error errno:', error?.errno);
			logger.error('Error sqlState:', error?.sqlState);
			logger.error('Error sqlMessage:', error?.sqlMessage);
			logger.error('Error stack:', error?.stack);
			
			// Try to stringify the entire error object
			try {
				logger.error('Full error object (stringified):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
			} catch (stringifyError: any) {
				logger.error('Could not stringify error object:', stringifyError?.message);
			}
			
			// Log the error directly
			logger.error('Raw error:', error);
		}
	});
});
