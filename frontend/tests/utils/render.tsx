import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import { ToastProvider } from "@/shared/context/ToastContext";

/**
 * Wraps given children with app-wide providers used in tests (routing and toast).
 *
 * @param children - React nodes to render within the providers
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ToastProvider>{children}</ToastProvider>
    </BrowserRouter>
  );
}

/**
 * Render a React element wrapped with app-wide providers for testing.
 *
 * @param ui - The React element to render
 * @param options - Additional render options; the `wrapper` option is omitted and will be set to `AllProviders`
 * @returns The render result object returned by React Testing Library
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Override render with our custom render
export { customRender as render };