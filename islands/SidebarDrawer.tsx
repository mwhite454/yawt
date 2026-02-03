import { useSignal } from "@preact/signals";
import { type ComponentChildren } from "preact";

interface SidebarDrawerProps {
  children: ComponentChildren;
  sidebarContent?: ComponentChildren;
}

export default function SidebarDrawer(
  { children, sidebarContent }: SidebarDrawerProps,
) {
  const isOpen = useSignal(false);

  const toggleDrawer = () => {
    isOpen.value = !isOpen.value;
  };

  return (
    <div class="drawer drawer-end">
      <input
        id="sidebar-drawer"
        type="checkbox"
        class="drawer-toggle"
        checked={isOpen.value}
        onChange={toggleDrawer}
      />
      <div class="drawer-content flex flex-col">
        {/* Main content */}
        {children}
      </div>
      <div class="drawer-side z-50">
        <label
          htmlFor="sidebar-drawer"
          aria-label="Close sidebar"
          class="drawer-overlay"
        >
        </label>
        <div class="menu bg-base-100 min-h-full w-80 p-4">
          {/* Sidebar header */}
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold">Tools</h2>
            <button
              class="btn btn-sm btn-circle btn-ghost"
              onClick={toggleDrawer}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Sidebar content */}
          <div class="flex-1 overflow-y-auto">
            {sidebarContent || (
              <div class="text-sm opacity-60">
                No tools available for this page
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
