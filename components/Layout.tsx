import { type ComponentChildren } from "preact";
import type { User } from "../utils/session.ts";

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
        <div class="navbar-end gap-2">
          {props.user
            ? (
              <>
                <div class="hidden sm:flex items-center gap-2">
                  {props.user.avatar_url && (
                    <div class="avatar">
                      <div class="w-8 rounded-full">
                        <img
                          src={props.user.avatar_url}
                          alt={props.user.login}
                        />
                      </div>
                    </div>
                  )}
                  <span class="text-sm opacity-80">
                    {props.user.name || props.user.login}
                  </span>
                </div>
                <a class="btn btn-sm" href="/auth/signout">
                  Sign out
                </a>
              </>
            )
            : (
              <a class="btn btn-primary btn-sm" href="/auth/signin">
                Sign in
              </a>
            )}
        </div>
      </div>

      <main class="p-4">
        <div class="max-w-6xl mx-auto">{props.children}</div>
      </main>
    </div>
  );
}
