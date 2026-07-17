import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layouts/AppShell.jsx";
import { PlaceholderView } from "../features/shared/PlaceholderView.jsx";

const views = {
  dashboard: ["Dashboard", "Daily triage and the next cards that need attention."],
  radar: ["Radar", "Research exact printings and plan ideas before money is committed."],
  positions: ["Positions", "Manage owned holdings, exits, and active position context."],
  signals: ["Signals", "Inspect computed attention from targets, plans, and market checks."],
  transactions: ["Transactions", "Review buy and sell events in the local ledger."],
  history: ["History", "Review actions, notes, and outcomes across the workflow."],
  admin: ["Admin", "Protect, inspect, export, and restore local ManaSpec data."],
};

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        {Object.entries(views).map(([path, [title, description]]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<PlaceholderView description={description} title={title} />}
          />
        ))}
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Route>
    </Routes>
  );
}
