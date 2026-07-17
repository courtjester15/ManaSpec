import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./app/App.jsx";
import { ErrorBoundary } from "./app/ErrorBoundary.jsx";
import { AppStateProvider } from "./state/AppState.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
);
