[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.47-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Responses%20API-412991?style=flat-square&logo=openai&logoColor=white)](https://platform.openai.com/)
[![Codex ChatGPT](https://img.shields.io/badge/Codex%20ChatGPT-Integrated-00a67e?style=flat-square&logo=openai&logoColor=white)](https://platform.openai.com/docs/guides/text-generation)

# Raven Webutils

Raven Webutils is a SvelteKit workbench for AI-powered utilities. It is designed to host a growing catalog of in-house copilots—spanning data extraction, summarization, compliance checking, and more—behind a unified workspace UI. The current build ships with the **Data Extractor**, and the sidebar already reserves space for the many agents that will follow.

![Data Extractor UI](docs/data-extractor.png)

> Screenshot placeholder — drop a capture of the latest UI into `docs/data-extractor.png` to activate the preview.

## Features

- **Modular AI tooling hub** – a shared layout, sidebar, and detail view make it easy for users to switch between the expanding roster of AI agents.
- **Data extraction grid** – define output schemas column-by-column, map prompts to each field, and upload batches of spreadsheets, PDFs, or dashboards.
- **OpenAI Responses integration** – server routes upload user files, generate JSON schemas, and call `gpt-5-nano` with the `file_extraction` tool to return structured data.
- **Live extraction telemetry** – debug cards show captured prompts, registered OpenAI file IDs, and status messages so analysts can audit every run.
- **Tailwind-driven theming** – custom gradients and dark-mode friendly components deliver a polished analyst console out of the box.

## Getting Started

### Prerequisites

- Node.js 20+
- An OpenAI API key with access to the Responses API and `gpt-5-nano`

### Installation

1. Install dependencies.

   ```sh
   npm install
   ```

2. Copy `.env.example` (create one if it does not exist yet) to `.env` and set the required secrets.

   ```ini
   OPENAI_API_KEY=sk-...
   ```

3. Start the development server.

   ```sh
   npm run dev -- --open
   ```

The app is served at [http://localhost:5173](http://localhost:5173). The sidebar lists all available AI utilities; selecting **Data Extractor** loads its workspace.

### Project Scripts

- `npm run dev` – start the Vite dev server with hot-module reload.
- `npm run build` – create a production bundle.
- `npm run preview` – serve the production build locally.
- `npm run check` – run `svelte-check` for type and accessibility diagnostics.
- `npm run lint` / `npm run format` – enforce Prettier + ESLint standards.

## Using the Data Extractor

1. **Choose the tool.** In the sidebar, select **Data Extractor** (additional agents will appear here as they launch).
2. **Define columns.** Click any column header to open the configuration dialog. Give each column a descriptive name and a prompt that explains what the extractor should pull from your documents. Add more columns with the **Add column** button.
3. **Upload documents.** Use the index column to attach source files. The grid auto-adds rows as you upload or enter values, so you can queue multiple documents at once.
4. **Review prompts.** The debug snapshot card lists every column and prompt that will be sent to OpenAI. Adjust prompts until the instructions are precise.
5. **Click Extract.** The status banner walks through each phase (payload prep, upload, model response). When the run finishes, extracted values populate the grid cells and returned file IDs appear in the debug panel.

### What Happens When You Click `Extract`

1. The Svelte component captures your column definitions, row values, and selected files, then builds a `FormData` payload that mirrors the grid.
2. The payload is POSTed to `src/routes/api/extract/+server.ts`.
3. The server validates input with `zod`, uploads each document to OpenAI’s Files API, and records the returned file IDs alongside their originating row.
4. Using your column prompts, the server builds a JSON schema via `buildResponseFormat` and assembles an instruction prompt. Both are sent to `openai.responses.create`, requesting `gpt-5-nano` with the `file_extraction` tool.
5. The OpenAI response is returned to the client with the prompt, schema, and file metadata. The client stores the uploads, renders the debug snapshot, and attempts to parse `response.output_text` as JSON to autofill the grid.
6. If parsing succeeds, the Data Extractor writes each value into the matching column cell. Errors show up in the status banner without discarding the snapshot so you can iterate quickly.

## Architecture Notes

- **Frontend** – built with Svelte 5 runes, Tailwind CSS, and handcrafted UI primitives in `src/lib/components/ui`.
- **State management** – writable stores in `src/lib/stores/data-extractor.ts` keep the grid, uploads, and debug state reactive.
- **Server API** – the extraction route lives in `src/routes/api/extract/+server.ts`, which isolates all OpenAI interactions.
- **Configuration** – shared styles are defined in `src/routes/layout.css`; Tailwind plugins and animation helpers are wired in the same file.

## Roadmap

- Add document summarizers, contract negotiators, and compliance checklists to the sidebar catalog.
- Persist extraction templates so analysts can save and replay column configurations.
- Provide job history with downloadable CSV exports and auditing metadata.
- Offer workspace-level configuration for custom OpenAI models or Azure OpenAI endpoints.

## Contributing

1. Follow the coding standards in this repo (TypeScript in Svelte components, tidy Tailwind groupings).
2. Run `npm run check` and `npm run lint` before opening a pull request.
3. Use action-oriented commit subjects (e.g., `feat: add contract auditor tool`) and attach relevant screenshots in PRs when UI changes occur.

---

Raven Webutils is still early, but the architecture is built to scale with a myriad of AI helpers. Start with the Data Extractor today and keep an eye on the sidebar as new copilots come online.
