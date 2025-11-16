# GEMINI.md - Project Context for Gemini

## Project Overview

**ClassiFi** is a web application built with **React**, **TypeScript**, and **Vite**. The project follows a clean, three-layer architectural pattern, separating concerns into `presentation`, `business`, and `data` layers.

The styling is managed by **Tailwind CSS**, with helper utilities like `clsx` and `tailwind-merge` for flexible component styling. The project is set up with absolute path aliases (`@/*`) to simplify module imports.

**Note:** There appears to be a redundant `frontend` directory which mirrors the root project structure. The primary application code resides in the root `src` directory. It is recommended to consolidate the project by removing the duplicate `frontend` directory.

## Key Technologies

- **Framework:** React 19
- **Language:** TypeScript 5.9
- **Build Tool:** Vite 7.2
- **Styling:** Tailwind CSS
- **Linting:** ESLint
- **Component Utilities:** `class-variance-authority`, `clsx`, `tailwind-merge`

## Building and Running

- **Install Dependencies:**
  ```bash
  npm install
  ```

- **Run Development Server:**
  ```bash
  npm run dev
  ```

- **Build for Production:**
  ```bash
  npm run build
  ```

- **Lint the Code:**
  ```bash
  npm run lint
  ```

- **Preview the Production Build:**
  ```bash
  npm run preview
  ```

## Development Conventions

- **Architecture:** The codebase is organized into three distinct layers:
  - `src/presentation`: Contains UI components, pages, and presentation logic (React components).
  - `src/business`: Contains core business logic, services, and domain models.
  - `src/data`: Contains data access logic, repositories, and API clients.

- **Styling:** Use Tailwind CSS utility classes for styling. The `cn` utility function (likely in `src/shared/utils/cn.ts`) should be used to conditionally apply classes to components.

- **Routing:** The project currently uses a simple state-based switch in `App.tsx` for navigation. A proper routing library like `react-router-dom` is a recommended next step.

- **Imports:** Use absolute path aliases for imports from the `src` directory (e.g., `import { Button } from '@/presentation/components/ui/Button'`).

- **Testing:** (TODO) No testing framework is currently configured. Setting up a framework like Vitest with React Testing Library is recommended.
