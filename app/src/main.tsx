import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "@/App"
import { DeviceFrame } from "@/components/device-frame"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DeviceFrame>
      <App />
    </DeviceFrame>
  </StrictMode>,
)
