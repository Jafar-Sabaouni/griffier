import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";

export interface DragDropWrapperProps {
  readonly onFileDrop: (file: File) => void;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly subtitle?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function DragDropWrapper({
  onFileDrop,
  disabled = false,
  title = "Drop file to upload",
  subtitle,
  className = "",
  children,
}: DragDropWrapperProps) {
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (disabled) {
      return;
    }
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileDrop(file);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={["relative", className].filter(Boolean).join(" ")}
    >
      {isDragging && !disabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 flex bg-surface-canvas/90 p-4"
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-accent-primary bg-surface-subtle p-6 text-center">
            <Upload className="h-6 w-6 text-text-primary" />
            <p className="text-sm font-medium text-text-primary">{title}</p>
            {subtitle && (
              <p className="text-xs text-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
