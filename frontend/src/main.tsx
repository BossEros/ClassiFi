import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./app/App"
import { supabaseAuthAdapter } from "./data/api/supabaseAuthAdapter"
import "./index.css"

supabaseAuthAdapter.initializeAuthListener()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
