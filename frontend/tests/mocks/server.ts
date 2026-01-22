/**
 * MSW Server Configuration
 *
 * Creates a mock server using the defined handlers.
 * Used in tests to intercept and mock HTTP requests.
 *
 * @see https://mswjs.io/docs/integrations/node
 */
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
