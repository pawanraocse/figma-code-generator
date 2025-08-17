# Figma Code Generator

## Overview

**Figma Code Generator** is an automated pipeline that converts Figma design nodes into production-ready Angular components. It streamlines the process of transforming design assets into maintainable, testable, and scalable frontend code, following modern Angular and enterprise architecture standards.

---

## Tech Stack
- **Frontend:** Angular 20+ (TypeScript, SCSS)
- **Backend/Tools:** Node.js, TypeScript
- **Build/Automation:** Custom pipeline scripts (TypeScript)
- **Testing:** Jest, Jasmine, Karma
- **Other:** Express (for SSR), RxJS

---

## Features
- Automated Figma-to-Angular code generation
- Standalone Angular components with OnPush change detection
- Modular, domain-driven folder structure
- Secure handling of secrets and environment variables
- SSR-ready Angular setup
- Centralized style/token management
- End-to-end pipeline: fetch → parse → generate tokens → generate components

---

## Folder Structure

```
figma-to-angular/
  ├── src/
  │   ├── app/
  │   │   ├── generated/           # Auto-generated Angular components
  │   │   ├── ...                  # App config, routes, main files
  │   ├── styles/                  # Centralized SCSS tokens
  │   ├── ...
  ├── tools/
  │   ├── generator.ts             # Generates Angular components from schema
  │   ├── parser.ts                # Parses Figma JSON to canonical schema
  │   ├── fetch.ts                 # Fetches Figma data
  │   ├── pipeline.ts              # Orchestrates the full pipeline
  │   ├── cache/                   # Stores intermediate and schema files
  ├── tests/                       # Jest/Karma test specs
  ├── public/                      # Static assets
  ├── package.json                 # Project dependencies
  ├── angular.json                 # Angular workspace config
  ├── README.md                    # Project documentation
```

---

## End-to-End Flow

1. **Fetch Figma Data:**
   - `tools/fetch.ts` pulls design data from Figma using API credentials.
2. **Parse to Schema:**
   - `tools/parser.ts` converts raw Figma JSON to a canonical schema.
3. **Generate Tokens:**
   - `tools/generate-tokens.ts` extracts design tokens (colors, spacing) to SCSS/CSS.
4. **Generate Angular Components:**
   - `tools/generator.ts` creates Angular components in `src/app/generated/`.
5. **Run Pipeline:**
   - `npm run pipeline` executes all steps in sequence.
6. **Serve/Build Angular App:**
   - Standard Angular CLI commands (`ng serve`, `ng build`, etc.)

---

## Setup & Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/pawanraocse/figma-code-generator.git
   cd figma-code-generator
   ```
2. **Install dependencies:**
   ```sh
   npm install
   cd figma-to-angular && npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file in the root (never commit this file).
   - Add your Figma API key and file ID:
     ```env
     FIGMA_FILE_ID=your-figma-file-id
     FIGMA_API_KEY=your-figma-api-key
     ```
4. **Run the pipeline:**
   ```sh
   npm run pipeline
   ```
5. **Serve the Angular app:**
   ```sh
   cd figma-to-angular
   npm start
   # or
   ng serve
   ```

---

## Usage

- **Automated Generation:**
  - The pipeline will generate Angular components in `src/app/generated/` based on your Figma design.
  - Update your Angular router to import the generated component (see `app.routes.ts`).
- **Regeneration:**
  - Rerun the pipeline whenever your Figma design changes.
- **Testing:**
  - Run unit and integration tests using Jest/Karma:
    ```sh
    npm test
    ```

---

## Security & Best Practices

- **Never commit secrets:** `.env` is ignored by `.gitignore`.
- **If a secret is accidentally committed:**
  - Remove it from `.env` and use `git filter-repo` to clean history.
- **Component generation is always modular and secure:**
  - OnPush change detection, strict typing, and centralized styles.
- **Update router imports to match generated component names.**

---

## Contribution Guidelines

- Fork the repo and create feature branches.
- Follow semantic commit messages (`feat:`, `fix:`, `docs:`, etc.).
- Write and update tests for all new features.
- Update `copilot-index.md` after significant changes.
- Submit PRs with clear descriptions and test coverage.

---

## Troubleshooting

- **Push Protection Error:**
  - If GitHub blocks a push due to secrets, follow [GitHub's guide](https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push) and use `git filter-repo`.
- **Component Import Errors:**
  - Ensure your router matches the generated component name and path.
- **Pipeline Issues:**
  - Check logs in `progress.md` and intermediate files in `tools/cache/`.

---

## References & Further Reading

- [Angular Documentation](https://angular.io/docs)
- [Figma API Reference](https://www.figma.com/developers/api)
- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)
- [copilot-index.md](./copilot-index.md) — for architectural details and update policy

---

## License

This project is licensed under the MIT License.

---

## Maintainers

- [Pawan Rao](https://github.com/pawanraocse)

---

## Update Policy

- Update this README and `copilot-index.md` after every significant code change, new feature, or refactor.

