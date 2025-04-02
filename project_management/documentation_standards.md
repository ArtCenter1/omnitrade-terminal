# Documentation Standards

This document defines the standards and guidelines for documentation across the OpenTrade project, including code comments, commit messages, and project management documents (like those in `/project_management`). Consistent and clear documentation is essential for maintainability, collaboration, and onboarding.

## 1. General Principles

*   **Clarity:** Write clearly and concisely. Avoid jargon where possible or explain it if necessary.
*   **Accuracy:** Ensure documentation reflects the current state of the code or plan. Update documentation when changes are made.
*   **Completeness:** Provide enough detail for the intended audience to understand the subject matter.
*   **Consistency:** Follow the defined standards consistently across the project.
*   **Audience:** Consider the intended audience (e.g., fellow developers, future self, non-technical stakeholders) and tailor the level of detail accordingly.

## 2. Code Comments

*   **Purpose:** Explain *why* something is done, not just *what* it does (the code itself should explain the *what*). Explain complex logic, workarounds, or non-obvious decisions.
*   **Language:** English.
*   **Style:**
    *   Use standard comment syntax for the language (e.g., `//` or `/* ... */` in TypeScript/JavaScript).
    *   Use JSDoc/TSDoc comments for functions, classes, interfaces, and complex types to enable better tooling support (intellisense, documentation generation).
    *   ```typescript
        /**
         * Calculates the total value based on items and a discount rate.
         * @param items - The list of items to process.
         * @param discountRate - The discount rate to apply (e.g., 0.1 for 10%).
         * @returns The calculated total value.
         */
        function calculateValue(items: Item[], discountRate: number): number {
          // Complex calculation logic explained here...
          return total;
        }
        ```
*   **Avoid:**
    *   Commenting obvious code.
    *   Leaving commented-out code blocks without explanation. Remove dead code instead.
    *   Writing comments that contradict the code.

## 3. Commit Messages

*   **Standard:** Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
*   **Format:**
    ```
    <type>[optional scope]: <description>

    [optional body]

    [optional footer(s)]
    ```
*   **Types:** `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`.
*   **Scope:** Optional, indicates the part of the codebase affected (e.g., `auth`, `ui`, `bots`, `api`).
*   **Description:** Imperative mood, present tense (e.g., "add login form", not "added login form" or "adds login form"). Keep it concise (<= 50 chars recommended).
*   **Body:** Optional, provides more context, explains the *why* behind the change. Use multiple paragraphs if needed.
*   **Footer:** Optional, used for referencing issue numbers (e.g., `Fixes #123`) or breaking changes (`BREAKING CHANGE: ...`).
*   **Example:**
    ```
    feat(auth): add password reset functionality

    Implement the complete password reset flow including request endpoint,
    email sending, token verification, and password update endpoint.

    Fixes #45
    ```

## 4. Project Management Documents (`/project_management`)

*   **Format:** Markdown (`.md`).
*   **Style:**
    *   Use clear headings (`#`, `##`, `###`) to structure content.
    *   Use lists (bulleted or numbered) for clarity.
    *   Use code blocks (```) for code examples or configuration snippets.
    *   Use tables for structured data where appropriate.
    *   Link related documents where necessary (e.g., `See [API Structure](api_structure.md)`).
*   **File Naming:** Use descriptive, lowercase names with underscores separating words (e.g., `data_model_user.md`).
*   **Maintenance:** Keep documents up-to-date as plans evolve or decisions change. Mark outdated sections clearly if they cannot be immediately updated.

## 5. README Files

*   The main `README.md` should provide a project overview, setup instructions, and key information (as defined in the updated root README).
*   Subdirectories may contain their own `README.md` files to explain the purpose and contents of that specific directory, if necessary.

By adhering to these standards, we aim to maintain a high quality of documentation throughout the OpenTrade project lifecycle.