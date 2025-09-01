# Quick Setup Instructions for Visual Flow Builder

## Step 1: Run the Setup Script

The easiest way to create the visual_flows collection is to run the setup script:

```bash
# Navigate to the extension directory
cd /home/d3adb0y/code/directus-case-mvp/directus/extensions/visual-flow-builder

# Copy the setup package.json
cp setup_package.json package.json

# Install dependencies for the setup script
npm install

# Run the setup script
node setup_collection.js
```

The script will:
- Connect to your Directus instance (using admin@example.com / d1r3ctu5)
- Check if the visual_flows collection exists
- Create the collection and all required fields if it doesn't exist
- Configure proper field types and interfaces

## Step 2: Verify Collection Creation

After running the setup script, you should see:
- A new "visual_flows" collection in your Directus admin panel
- The collection should have fields: name, description, nodes, connections, status
- The collection icon should be an account_tree icon

## Step 3: Build and Use the Extension

```bash
# Build the extension (if not already done)
npm run build

# Restart Directus if needed
```

## Troubleshooting

If the setup script fails:

1. **Check Directus connection**: Make sure Directus is running on http://localhost:8055
2. **Check credentials**: Verify admin email/password in the script match your setup
3. **Manual setup**: Use the SQL file instead:
   ```bash
   # Run the SQL directly in your database
   psql -U directus -d directus -f setup_collection.sql
   ```

## After Setup

Once the collection is created, you can:
1. Navigate to the Visual Flow Builder module in Directus
2. Click "New Flow" to create your first visual flow
3. Use the node palette to add terminal, process, decision, and connector nodes
4. Save your flows and they'll be stored in the visual_flows collection
