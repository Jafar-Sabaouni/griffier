import { Route, Routes } from "react-router";

function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Griffier</h1>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
