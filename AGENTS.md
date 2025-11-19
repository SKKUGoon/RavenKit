# Repository Guidelines

## Project Structure & Module Organization
- `src/routes` holds SvelteKit pages. `+page.svelte` is the single-page AI tooling explorer, while `+layout.svelte` wires shared CSS and favicon. Extend new features here or under `src/lib` for reusable components.
- Global styles live in `src/routes/layout.css` and are powered by Tailwind CSS directives/plugins declared there.
- Static assets belong in `static/` for direct hosting. Use `$lib/assets` for imported images, as seen with the favicon.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server with hot-module reload.
- `npm run build` — create a production build through `vite build`.
- `npm run preview` — serve the production build locally for smoke-testing.
- `npm run check` — sync SvelteKit types and run `svelte-check` for type and accessibility diagnostics.
- `npm run lint` / `npm run format` — run Prettier + ESLint or auto-format the repo.

## Coding Style & Naming Conventions
- Use TypeScript in Svelte components (`<script lang="ts">`) and prefer explicit types for shared data, as in the `Tool` interface.
- Keep Tailwind utility classes tidy and grouped by layout → spacing → color when possible.
- Stick to kebab-case filenames for routes (`+page.svelte`, nested `+layout.svelte`) and PascalCase for exported components in `src/lib`.
- Run `npm run format` before pushing; Prettier handles indentation (tabs in JSON, tabs/spaces per formatter defaults) and Tailwind plugin reorders class lists.

## Testing Guidelines
- The repo currently relies on `svelte-check` for static analysis. Add Vitest or Playwright suites under `tests/` or `src` when functionality requires regression coverage.
- Name new spec files `<component>.spec.ts` and run them via `npm test` once the script is added; update this guide accordingly.

## Commit & Pull Request Guidelines
- Follow conventional, action-oriented commit subjects (e.g., `feat: add AI tool sidebar`). Keep bodies short but mention affected areas.
- For pull requests, include: summary of changes, testing evidence (`npm run check`, screenshots of UI states), and linked Jira/GitHub issues when applicable. Tag reviewers from design and engineering when UI/UX files change.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.