import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import { CaptureLanding } from "./features/capture/CaptureLanding";
import { InterviewWorkspacePage } from "./pages/InterviewWorkspacePage";

const DevPrimitivesPage = import.meta.env.DEV
  ? lazy(() =>
      import("./pages/PrimitivesPage").then((module) => ({
        default: module.PrimitivesPage,
      })),
    )
  : null;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CaptureLanding />} />
      <Route path="/interviews/:id" element={<InterviewWorkspacePage />} />
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
