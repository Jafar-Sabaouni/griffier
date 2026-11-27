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

const VIEWPORT_PADDING_PX = 8;
const MENU_ESTIMATED_WIDTH_PX = 192;
const MENU_ITEM_HEIGHT_PX = 40;
const MENU_VERTICAL_PADDING_PX = 16;

function clampPosition(
  position: ContextMenuPosition,
  itemCount: number,
): ContextMenuPosition {
  if (typeof window === "undefined") {
    return position;
  }
  const estimatedHeight = itemCount * MENU_ITEM_HEIGHT_PX + MENU_VERTICAL_PADDING_PX;
  const maxX = Math.max(
    VIEWPORT_PADDING_PX,
    window.innerWidth - MENU_ESTIMATED_WIDTH_PX - VIEWPORT_PADDING_PX,
  );
  const maxY = Math.max(
    VIEWPORT_PADDING_PX,
    window.innerHeight - estimatedHeight - VIEWPORT_PADDING_PX,
  );
  return {
    x: Math.min(Math.max(VIEWPORT_PADDING_PX, position.x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING_PX, position.y), maxY),
  };
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

  const clamped = clampPosition(position, items.length);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      style={{ left: clamped.x, top: clamped.y }}
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
