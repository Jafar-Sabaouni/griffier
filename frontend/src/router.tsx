import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";

import { CaptureLanding } from "./features/capture/CaptureLanding";

const DevPrimitivesPage = import.meta.env.DEV
  ? lazy(() =>
      import("./pages/PrimitivesPage").then((module) => ({
        default: module.PrimitivesPage,
      })),
    )
  : null;

function InterviewWorkspacePlaceholder() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="min-h-screen bg-surface-canvas p-6">
      <h1 className="text-lg font-semibold text-text-primary">
        Interview Workspace
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Interview: {id ?? "unknown"}
      </p>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CaptureLanding />} />
      <Route path="/interviews/:id" element={<InterviewWorkspacePlaceholder />} />
      {DevPrimitivesPage && (
        <Route
          path="/primitives"
          element={
            <Suspense fallback={null}>
              <DevPrimitivesPage />
            </Suspense>
          }
        />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
