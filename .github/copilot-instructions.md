---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## Headers

This document outlines the rules and guidelines for the AI coding assistant to follow when working on the Directus project. It covers project structure, coding standards, workflow, and best practices. Adherence to these rules ensures consistency, maintainability, and quality of the codebase.

## TECH STACK

*   **Directus:** Version 9 (and aiming for latest).
*   **Vue.js:** Version 3.
*   **JavaScript/TypeScript:** ES6+
*   **pnpm:** As the package manager.
*   **Vite:** Build tool.
*   **@directus/composables:** For data fetching.

## PROJECT STRUCTURE

*   The project is a monorepo.
*   Relevant directories include `app`, `packages/extensions`.
*   Custom Vue Flow nodes are located in the appropriate directory.

## CODING STANDARDS

*   Follow Vue.js official style guide.
*   Use TypeScript for all new code.
*   Linting errors must always be resolved.
*   Ensure proper Vue Flow types are used when working with Vue Flow.
*   When fixing linting errors:
    *   Move `<script setup>` above `<template>` section.
    *   Use boolean attribute shorthand (e.g., `draggable` instead of `:draggable="true"`).
    *   Remove or comment out `console.error` statements.
    *   Add blank lines between function declarations.
    *   Remove unused imports.
    *   Prefix unused parameters with `_` or remove them.
    *   Remove unused functions.
    *   Change `error.message` to `error.code` when dealing with validation errors.
*   Nodes in Vue Flow should have both `label` and `data.label` properties.
*   All Vue Flow nodes must have `position` properties.
*   Use `user-select: none` to prevent text selection during drag operations.

## WORKFLOW & RELEASE RULES

*   Always build the entire monorepo from the root directory using `pnpm build`. This ensures that all workspace dependencies are built in the correct order.
*   When addressing issues with canvas bounds:
    *   Make the main container (`flow-builder-container`) use `flex: 1` to take up remaining height.
    *   Add `overflow: hidden` and `position: relative` for proper containment.
    *   Set `.canvas-container` to `width: 100%` and `height: 100%`.
    *   Add `overflow: hidden` to prevent scrolling issues.
    *   Use `:deep()` selector to style Vue Flow's internal components.
    *   Target `.vue-flow`, `.vue-flow__viewport`, `.vue-flow__background`, and `.vue-flow__pane` and set all to `width: 100%` and `height: 100%`.
    *   Add `z-index: 10` to sidebars to ensure they stay above the canvas.
    *   Use `flex-shrink: 0` on the header to prevent it from being compressed.
    *   Use CSS Grid with `grid-template-columns: 250px 1fr 300px` for the `builder-layout`.
*   Disable automatic viewport fitting when nodes change in Vue Flow. Add `:zoom-on-double-click="false"` to prevent unwanted zoom behavior and comment out any watch functions that trigger `fitView` on node changes.
*   When fixing drag and drop functionality, ensure to get the correct canvas element bounds for accurate drop position calculation.
*   When navigating between workflows using Off-Page Connectors or creating new entries via Form Nodes:
    *   Open linked content in a new tab using `window.open(targetUrl, '_blank')`.
    *   Use `/collections/{collection}/{id}` format for navigation URLs in Directus.
    *   For creating a new entry, the URL should end with `/{collection_name}/+`.
*   Edge connections can be modified by ensuring `edges-updatable="true"` and `edges-reconnectable="true"` props are configured. Use `type="source"` for all handles to allow connections from any handle to any other handle.
*   Selection outlines for Vue Flow nodes should match the shape of the node type. Use CSS `clip-path` with `polygon()` and pseudo-elements (`::after`) for creating exact geometric shapes for the selection outlines.
*   Edge type should be step edge and animated. All edges should include `markerEnd: 'arrowclosed'` to clearly indicate the flow direction.
*   For Process nodes, create two sub types: "form" and "task".
    *   Task Nodes: Blue rectangles with square icon (default behavior).
    *   Form Nodes: Green rectangles with document icon, includes collection linking.
*   When working with Process Map component ensure the layout matches the CPS framework.
    *   Allocate horizontal space as:
        *   Request Service/Report: 1/5th
        *   Evaluate Service: 1/5th
        *   Provide Services: 2/5ths (double the space)
        *   Reevaluate Services: 1/5th
*   When working with Process Map component, the swim lanes in the bottom section need to reflect the same proportions as the node spacing: 1/5, 1/5, 2/5, 1/5.
*   In the Process Map component, for the "Appropriate to Continue?" decision node:
    *   Remove the icon inside the node.
    *   Change the background color to a lighter yellow (`#fbbf24` to `#f59e0b`).
    *   Change the font color to black.
*   In the Process Map component, position the nodes exactly as laid out in the reference screenshot.
*   In the Process Map component, the header should have the title centered using flexbox and the program dropdown right-aligned.
*   In the Process Map component, the title should be centered using flexbox.
*   In the Process Map component, the program dropdown should be right aligned and have a width of `300px`.
*   In the Process Map component, all nodes should use the same font size.
*   In the Process Map component, the nodes on the canvas should react to viewport changes.
*   When adding a custom header component to a collection:
    *   Add a `custom_header_component` field to the collection metadata.
    *   Create a migration for this new field.
    *   Update the collection types to include this field (e.g., in `collections.yaml`).
    *   Create the custom header component (basic and/or advanced).
    *   Modify the content module's item route to use custom headers when specified.
    *   Apply the database migration to add the `custom_header_component` field to the database.
    *   In the `item.vue` file, use the `#header` slot of `private-view` to override the entire header area when using custom headers.
    *   Ensure that when a custom header is used, the original header elements (title, headline, actions) are hidden.
    *   Custom headers should be integrated into custom item components (like ProcessMap) rather than replacing the standard Directus header. Specifically, when a collection uses a custom item component AND has a custom header configured, the custom header should replace the standard editor header within the custom item component.
*   In the Process Map, enable snap to grid.
*   In the Process Map control bar, add a button to "freeze" the current state (zoom, node positions) to the collection.

## DEBUGGING

*   Use `console.log` statements for debugging purposes. Remember to remove them before committing the code.
*   Inspect the build output for warnings and errors.
*   When debugging Vue Flow edge updates, check the console logs for `onEdgeUpdate` function calls and verify that the data is being updated correctly.

## PROJECT DOCUMENTATION & CONTEXT SYSTEM

*   Consult the Vue Flow documentation for implementation details.

## BEST PRACTICES

*   Write clear and concise code.
*   Add comments to explain complex logic.
*   Keep functions small and focused.
*   Test your code thoroughly.
*   Pay attention to warnings about chunk sizes; consider code splitting for better performance.
*   Ensure Vue Flow's parent container has defined width and height.
*   Ensure the background component fills the entire canvas area in Vue Flow.
*   Use `height: 100%` to make components take up exactly the available vertical space within their parent container, avoiding scrolling within the content area.
*   When implementing drag and drop functionality, use `user-select: none` to prevent text selection during drag operations.