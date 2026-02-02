import type { User } from "@utils/session.ts";

export function UserMenu(props: { user: User | null }) {
  if (!props.user) {
    return (
      <a class="btn btn-primary btn-sm" href="/auth/signin">
        Sign in
      </a>
    );
  }

  return (
    <div class="dropdown dropdown-end">
      <div tabIndex={0} role="button" class="btn btn-ghost btn-circle avatar">
        <div class="w-10 rounded-full">
          <img
            src={
              props.user.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(props.user.name || props.user.login)}&background=random`
            }
            alt={props.user.login}
          />
        </div>
      </div>
      <ul
        tabIndex={0}
        class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow mt-2"
      >
        <li class="menu-title">
          <span>{props.user.name || props.user.login}</span>
        </li>
        <li>
          <a href="/auth/signout">Sign out</a>
        </li>
      </ul>
    </div>
  );
}
