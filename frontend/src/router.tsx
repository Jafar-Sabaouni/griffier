import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";

const DevPrimitivesPage = import.meta.env.DEV
  ? lazy(() =>
      import("./pages/PrimitivesPage").then((module) => ({
        default: module.PrimitivesPage,
      })),
    )
  : null;

function LandingPlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          Griffier
        </h1>
        <p className="text-sm text-text-secondary">
          Record or upload an interview for speaker-attributed transcripts and source-grounded fact-checks.
        </p>
      </div>
    </main>
  );
}

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
      <Route path="/" element={<LandingPlaceholder />} />
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
