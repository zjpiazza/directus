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
*   When using Vue Flow, use `type="source"` for all handles to allow connections from any handle to any other handle.
*   Edge connections can be modified by ensuring `edges-updatable="true"` and `edges-reconnectable="true"` props are configured.
*   Selection outlines for Vue Flow nodes should match the shape of the node type. Use CSS `clip-path` with `polygon()` and pseudo-elements (`::after`) for creating exact geometric shapes for the selection outlines.
*   Edge type should be step edge and animated.