import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

export interface ContextMenuPosition {
  readonly x: number;
  readonly y: number;
}

export interface ContextMenuProps {
  readonly open: boolean;
  readonly position: ContextMenuPosition;
  readonly items: readonly ContextMenuItem[];
  readonly onClose: () => void;
  readonly ariaLabel?: string;
}

export function ContextMenu({
  open,
  position,
  items,
  onClose,
  ariaLabel = "Context actions",
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, onClose]);

  if (!open || items.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      style={{ left: position.x, top: position.y }}
      className="fixed z-50 min-w-44 rounded-md border border-border-subtle bg-surface-canvas p-1 shadow-floating"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          className="flex w-full cursor-pointer items-center rounded-xs px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-50"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
