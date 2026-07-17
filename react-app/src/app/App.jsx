import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layouts/AppShell.jsx";
import { AdminView, DashboardView, HistoryView, PositionsView, RadarView, SignalsView, TransactionsView } from "../features/views/Views.jsx";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/radar" element={<RadarView />} />
        <Route path="/positions" element={<PositionsView />} />
        <Route path="/signals" element={<SignalsView />} />
        <Route path="/transactions" element={<TransactionsView />} />
        <Route path="/history" element={<HistoryView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Route>
    </Routes>
  );
}
