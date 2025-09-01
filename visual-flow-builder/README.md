# Visual Flow Builder Extension

A simplified visual flow builder extension for Directus that allows users to create flowcharts with terminal, process, decision, and connector nodes.

## Features

- **Simple Node Types**: 
  - Terminal nodes (Start/End)
  - Process nodes (with Directus collection linking)
  - Decision nodes (Yes/No branching)
  - Connector nodes (On/Off page connectors)

- **Process Node Integration**: 
  - Link process nodes to Directus collections
  - Create new items in collections through the flow

- **Persistence**: 
  - Save flow definitions in Directus
  - Visual flows stored as JSON with node positions and connections

- **Visual Editor**:
  - Drag and drop interface
  - Node palette for easy creation
  - Properties panel for node configuration
  - SVG-based canvas with grid

## Installation

1. Place this extension in your Directus extensions folder:
   ```
   directus/extensions/visual-flow-builder/
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. **Set up the visual_flows collection** (choose one method):

   ### Method A: Using the Setup Script (Recommended)
   ```bash
   cd /path/to/directus/extensions/visual-flow-builder
   cp setup_package.json package.json
   npm install
   node setup_collection.js
   ```

   ### Method B: Manual SQL Setup
   Run the SQL in `setup_collection.sql` directly in your database:
   ```bash
   # For PostgreSQL
   psql -U directus -d directus -f setup_collection.sql
   
   # Or execute the SQL through Directus admin panel
   # Go to Settings → Data Model → Run Raw SQL
   ```

   ### Method C: Automatic Setup (May not work reliably)
   The extension will attempt to create the collection automatically when first accessed, but this method is less reliable.

4. Restart your Directus instance

5. The Visual Flow Builder module will appear in your Directus admin panel

## Usage

### Creating a New Flow

1. Navigate to the Visual Flow Builder module in Directus
2. Click "New Flow"
3. Enter a name and description
4. Start adding nodes from the palette

### Node Types

#### Terminal Node
- Used for start and end points
- Circular shape with green (start) or red (end) styling
- Configure variant as "start" or "end"

#### Process Node
- Rectangular nodes for process steps
- Can be linked to Directus collections
- When linked, allows creation of new items in that collection

#### Decision Node
- Diamond-shaped nodes for branching logic
- Has Yes/No output connections
- Used for conditional flow paths

#### Connector Node
- Pentagon-shaped nodes for page connections
- Useful for complex flows that span multiple diagrams
- Can be "onpage" or "offpage" variants

### Linking Process Nodes to Collections

1. Select a process node
2. In the properties panel, choose a collection from the dropdown
3. This creates a link that can trigger item creation in that collection

## Data Structure

### Flow Definition
```json
{
  "id": "uuid",
  "name": "Flow Name",
  "description": "Flow description",
  "nodes": [...],
  "connections": [...],
  "status": "draft|published|archived"
}
```

### Node Structure
```json
{
  "id": "node_id",
  "type": "terminal|process|decision|connector",
  "x": 100,
  "y": 100,
  "label": "Node Label",
  "description": "Optional description",
  "collection": "collection_name", // For process nodes
  "variant": "start|end|onpage|offpage" // For terminal/connector nodes
}
```

### Connection Structure
```json
{
  "id": "connection_id",
  "from": "source_node_id",
  "to": "target_node_id",
  "path": "SVG path string"
}
```

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### File Structure
```
src/
├── index.ts              # Main module definition
├── module.vue            # Main Vue component
├── setup-hook.ts         # Collection setup hook
└── components/
    ├── TerminalNode.vue   # Terminal node component
    ├── ProcessNode.vue    # Process node component
    ├── DecisionNode.vue   # Decision node component
    └── ConnectorNode.vue  # Connector node component
```

## Future Enhancements

- **Connection Drawing**: Visual connection creation with mouse drag
- **Auto Layout**: Automatic node arrangement algorithms
- **Export Options**: Export flows as images or other formats
- **Flow Execution**: Runtime execution of flow logic
- **Validation**: Flow validation and error checking
- **Templates**: Pre-built flow templates
- **Collaboration**: Multi-user editing capabilities

## API Integration

The extension integrates with Directus APIs for:
- Collection listing for process node configuration
- Flow persistence in the `visual_flows` collection
- Item creation when process nodes are executed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
