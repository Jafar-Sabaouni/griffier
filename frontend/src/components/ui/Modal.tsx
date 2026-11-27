import { X } from "lucide-react";
import { useEffect, useId } from "react";
import type { ReactNode } from "react";

import {
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
} from "./Button";

export interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly subtitle?: string;
  readonly body: ReactNode;
  readonly footer?: ReactNode;
  readonly onClose: () => void;
}

export function Modal({
  open,
  title,
  subtitle,
  body,
  footer,
  onClose,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/30 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-surface-canvas p-6 shadow-floating"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-text-primary"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
            )}
          </div>
          <Button
            variant={ButtonVariants.GHOST}
            size={ButtonSizes.SM}
            shape={ButtonShapes.ICON}
            aria-label="Close modal"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        <div>{body}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
