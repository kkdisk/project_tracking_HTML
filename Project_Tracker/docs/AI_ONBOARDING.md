# AI Agent Onboarding Guide

## Project Overview
**Project Tracker** is a Single-File React Application (SPA) designed for project management.
It uses a unique "Inline Build" architecture where `src/` source code is compiled into a single `index.html` file for deployment.

## Architecture
- **Source**: `src/` (Components, Hooks, Utils)
- **Entry Point**: `src/App.jsx`
- **Build Script**: `scripts/build.js` (Run via `npm run build`)
- **Output**: `build/index.html` (The only file needed for production)
- **Backend**: `apps_script_complete.gs` (Google Apps Script, connected via Web App URL)

## Key Documentation (In `docs/`)
If you are an AI assistant starting on this project, please read these first:
1.  **`task.md`**: Current project status and todo list.
2.  **`implementation_plan.md`**: Details of the recent refactoring (hooks extraction).
3.  **`refactoring_oauth_research.md`**: Context on API/CORS implementation.
4.  **`UPGRADE_ROADMAP.md`**: Future goals.

## Development Workflow
1.  **Edit**: Modify files in `src/`. DO NOT edit `build/index.html` directly.
2.  **Build**: Run `node scripts/build.js`.
3.  **Test**: Open `build/index.html` in a browser.

## Critical Rules
- **Hooks**: All hooks are in `src/hooks/`. Use `React.useState` etc. to avoid destructuring conflicts during bundling.
- **Styles**: Tailwind CSS is used via CDN (in `src/index.template.html`).
- **Deployment**: Single-file copy of `build/index.html`.
