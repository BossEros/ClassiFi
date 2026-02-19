/**
 * Application Entry Point
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./presentation/App"
import { supabaseAuthAdapter } from "./data/api/supabaseAuthAdapter"
import "./index.css"

// Initialize Supabase auth listener for automatic token refresh
// This ensures the authToken in localStorage stays in sync with Supabase
supabaseAuthAdapter.initializeAuthListener()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
