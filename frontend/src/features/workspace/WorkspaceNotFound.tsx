import { ArrowLeft } from "lucide-react";

import { Button, ButtonSizes, ButtonVariants } from "../../components/ui";

export interface WorkspaceNotFoundProps {
  readonly message: string | null;
  readonly onBack: () => void;
}

export function WorkspaceNotFound({ message, onBack }: WorkspaceNotFoundProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          Interview not found
        </h1>
        <p className="text-sm text-text-secondary">
          {message ?? "This interview could not be loaded."}
        </p>
        <Button
          variant={ButtonVariants.PRIMARY}
          size={ButtonSizes.MD}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Griffier
        </Button>
      </div>
    </main>
  );
}
