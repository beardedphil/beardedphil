import { Routes, Route, Navigate } from "react-router-dom";
import { PortfolioPage } from "./pages/PortfolioPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
