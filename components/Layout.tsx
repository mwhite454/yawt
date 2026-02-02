import { type ComponentChildren } from "preact";
import type { User } from "@utils/session.ts";
import { UserMenu } from "@components/UserMenu.tsx";

export function Layout(props: {
  user: User | null;
  title?: string;
  children: ComponentChildren;
}) {
  const title = props.title ?? "YAWT";

  return (
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-sm">
        <div class="navbar-start">
          <a class="btn btn-ghost text-xl" href="/">
            {title}
          </a>
        </div>
        <div class="navbar-center hidden md:flex">
          {props.user && (
            <ul class="menu menu-horizontal px-1">
              <li>
                <a href="/series">Series</a>
              </li>
            </ul>
          )}
        </div>
        <div class="navbar-end">
          <UserMenu user={props.user} />
        </div>
      </div>

      <main class="p-4">
        <div class="max-w-6xl mx-auto">{props.children}</div>
      </main>
    </div>
  );
}
