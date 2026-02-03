import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/**
 * Item type constraint - must have a title property for display
 */
export interface DraggableItem {
  title: string;
}

export interface DraggableListProps<T extends DraggableItem> {
  /** Array of items to display. Each must have a `title` property. */
  items: T[];
  /** Called after a reorder with the new array. Should persist the change. */
  onChange: (reorderedItems: T[]) => Promise<void>;
  /** Called when an error occurs during reorder */
  onError?: (error: Error) => void;
  /** Disable all drag interactions */
  disabled?: boolean;
  /** Additional CSS classes for the list container */
  className?: string;
  /** Optional key extractor for stable React keys (defaults to index) */
  keyExtractor?: (item: T, index: number) => string;
  /** Optional render function for custom item content */
  renderItem?: (item: T, index: number) => preact.ComponentChildren;
  /** ID of the currently selected/active item (for visual indication) */
  activeId?: string;
  /** Base URL for item links (if provided, items become links) */
  itemHref?: (item: T, index: number) => string;
}

export default function DraggableList<T extends DraggableItem>({
  items,
  onChange,
  onError,
  disabled = false,
  className = "",
  keyExtractor,
  renderItem,
  activeId,
  itemHref,
}: DraggableListProps<T>) {
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keyboard accessibility state
  const [keyboardGrabbedIndex, setKeyboardGrabbedIndex] = useState<
    number | null
  >(null);

  // Touch state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const touchStartY = useRef<number>(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Use ref to prevent race conditions during rapid reordering
  const isSavingRef = useRef(false);

  // Live region for screen reader announcements
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear after a delay to allow re-announcement of same message
    setTimeout(() => setAnnouncement(""), 1000);
  }, []);

  // Compute reordered array
  const reorderItems = useCallback(
    (fromIndex: number, toIndex: number): T[] => {
      if (fromIndex === toIndex) return items;
      const result = [...items];
      const [moved] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, moved);
      return result;
    },
    [items],
  );

  // Execute reorder with await
  const executeReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || disabled || isSavingRef.current) return;

      const newItems = reorderItems(fromIndex, toIndex);
      isSavingRef.current = true;
      setIsSaving(true);

      try {
        await onChange(newItems);
        announce(`Item moved to position ${toIndex + 1} of ${items.length}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
        setDraggedIndex(null);
        setHoverIndex(null);
        setKeyboardGrabbedIndex(null);
        setTouchDragIndex(null);
      }
    },
    [items, disabled, reorderItems, onChange, onError, announce],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HTML5 Drag & Drop handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: DragEvent, index: number) => {
      if (disabled || isSaving) {
        e.preventDefault();
        return;
      }
      setDraggedIndex(index);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      }
    },
    [disabled, isSaving],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }, []);

  const handleDragEnter = useCallback(
    (index: number) => {
      if (draggedIndex !== null && draggedIndex !== index) {
        setHoverIndex(index);
      }
    },
    [draggedIndex],
  );

  const handleDragLeave = useCallback(() => {
    // Only clear if we're leaving the list entirely
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== dropIndex) {
        executeReorder(draggedIndex, dropIndex);
      } else {
        setDraggedIndex(null);
        setHoverIndex(null);
      }
    },
    [draggedIndex, executeReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setHoverIndex(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Touch event handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: TouchEvent, index: number) => {
      if (disabled || isSaving) return;
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      setTouchDragIndex(index);
    },
    [disabled, isSaving],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (touchDragIndex === null || !listRef.current) return;

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      if (element) {
        const listItem = element.closest("[data-drag-index]");
        if (listItem) {
          const targetIndex = parseInt(
            listItem.getAttribute("data-drag-index") || "-1",
            10,
          );
          if (targetIndex !== -1 && targetIndex !== touchDragIndex) {
            setHoverIndex(targetIndex);
          }
        }
      }

      // Prevent scrolling while dragging
      e.preventDefault();
    },
    [touchDragIndex],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchDragIndex !== null && hoverIndex !== null) {
      executeReorder(touchDragIndex, hoverIndex);
    } else {
      setTouchDragIndex(null);
      setHoverIndex(null);
    }
  }, [touchDragIndex, hoverIndex, executeReorder]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Keyboard accessibility handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      if (disabled || isSaving) return;

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          if (keyboardGrabbedIndex === null) {
            // Grab the item
            setKeyboardGrabbedIndex(index);
            announce(
              `Grabbed item ${
                index + 1
              } of ${items.length}. Use arrow keys to move, Enter or Space to drop, Escape to cancel.`,
            );
          } else if (keyboardGrabbedIndex === index) {
            // Drop in place (no change)
            setKeyboardGrabbedIndex(null);
            announce("Item dropped in original position");
          } else {
            // Drop at current position
            executeReorder(keyboardGrabbedIndex, index);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (keyboardGrabbedIndex !== null && keyboardGrabbedIndex > 0) {
            const newIndex = keyboardGrabbedIndex - 1;
            executeReorder(keyboardGrabbedIndex, newIndex);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (
            keyboardGrabbedIndex !== null &&
            keyboardGrabbedIndex < items.length - 1
          ) {
            const newIndex = keyboardGrabbedIndex + 1;
            executeReorder(keyboardGrabbedIndex, newIndex);
          }
          break;

        case "Escape":
          e.preventDefault();
          if (keyboardGrabbedIndex !== null) {
            setKeyboardGrabbedIndex(null);
            announce("Reorder cancelled");
          }
          break;
      }
    },
    [
      disabled,
      isSaving,
      keyboardGrabbedIndex,
      items.length,
      executeReorder,
      announce,
    ],
  );

  // Clean up on unmount or items change
  useEffect(() => {
    return () => {
      setDraggedIndex(null);
      setHoverIndex(null);
      setKeyboardGrabbedIndex(null);
      setTouchDragIndex(null);
    };
  }, [items]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  const isDragging = draggedIndex !== null || touchDragIndex !== null;
  const currentDragIndex = draggedIndex ?? touchDragIndex;

  const getItemKey = (item: T, index: number): string => {
    if (keyExtractor) return keyExtractor(item, index);
    // Try common id patterns
    const itemAny = item as Record<string, unknown>;
    if (typeof itemAny.id === "string") return itemAny.id;
    return String(index);
  };

  const getItemContent = (item: T, index: number): preact.ComponentChildren => {
    if (renderItem) return renderItem(item, index);
    return item.title;
  };

  return (
    <>
      {/* Screen reader live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        class="sr-only"
        style={{ position: "absolute", left: "-10000px" }}
      >
        {announcement}
      </div>

      <ul
        ref={listRef}
        class={`menu bg-base-200 rounded-box ${className}`}
        role="listbox"
        aria-label="Reorderable list"
        aria-describedby="drag-instructions"
      >
        {/* Hidden instructions for screen readers */}
        <span id="drag-instructions" class="sr-only">
          Press Space or Enter to grab an item, use arrow keys to move it, then
          press Space or Enter again to drop it. Press Escape to cancel.
        </span>

        {items.map((item, index) => {
          const isBeingDragged = currentDragIndex === index;
          const isHoverTarget =
            hoverIndex === index && currentDragIndex !== index;
          const isKeyboardGrabbed = keyboardGrabbedIndex === index;
          const isActive =
            activeId !== undefined && (item as { id?: string }).id === activeId;

          const itemClasses = [
            // Base styling
            "relative transition-all duration-150",
            // Drag visual feedback
            isBeingDragged && "opacity-50",
            isKeyboardGrabbed &&
              "ring-2 ring-primary ring-offset-2 ring-offset-base-100",
            // Hover target indicator
            isHoverTarget && "border-t-2 border-primary",
            // Disabled state
            (disabled || isSaving) && "cursor-not-allowed opacity-60",
            // Normal cursor
            !disabled && !isSaving && "cursor-grab",
            // Active/selected state
            isActive && "active",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <span class="flex items-center gap-2 w-full">
              {/* Drag handle indicator */}
              <span
                class={`opacity-40 ${isKeyboardGrabbed ? "text-primary" : ""}`}
                aria-hidden="true"
              >
                ⋮⋮
              </span>
              <span class="flex-1">{getItemContent(item, index)}</span>
              {isSaving && isBeingDragged && (
                <span class="loading loading-spinner loading-xs" />
              )}
            </span>
          );

          const commonProps = {
            "data-drag-index": index,
            draggable: !disabled && !isSaving,
            onDragStart: (e: DragEvent) => handleDragStart(e, index),
            onDragOver: handleDragOver,
            onDragEnter: () => handleDragEnter(index),
            onDragLeave: handleDragLeave,
            onDrop: (e: DragEvent) => handleDrop(e, index),
            onDragEnd: handleDragEnd,
            onTouchStart: (e: TouchEvent) => handleTouchStart(e, index),
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onKeyDown: (e: KeyboardEvent) => handleKeyDown(e, index),
            tabIndex: 0,
            role: "option" as const,
            "aria-selected": isActive,
            "aria-grabbed": isKeyboardGrabbed || isBeingDragged,
            "aria-dropeffect": isDragging
              ? ("move" as const)
              : ("none" as const),
            style:
              touchDragIndex === index ? { touchAction: "none" } : undefined,
          };

          return (
            <li key={getItemKey(item, index)} class={itemClasses}>
              {itemHref ? (
                <a
                  {...commonProps}
                  href={itemHref(item, index)}
                  class={isActive ? "active" : ""}
                >
                  {content}
                </a>
              ) : (
                <div {...commonProps} class="cursor-grab">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
