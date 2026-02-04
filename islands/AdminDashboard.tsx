import { useEffect, useState } from "preact/hooks";

interface UserProfile {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  role?: "admin" | "subscriber" | "free";
  subscriptionTier?: string;
  subscriptionExpiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
  blocked?: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUserRole = async (userId: number, role: string) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      await loadUsers();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleBlockUser = async (userId: number, currentBlocked: boolean) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blocked: !currentBlocked }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      await loadUsers();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="flex justify-center items-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">User Management</h2>

        {error && (
          <div class="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} class="text-center py-8 opacity-60">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} class={user.blocked ? "opacity-50" : ""}>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="avatar">
                          <div class="mask mask-squircle w-12 h-12">
                            <img
                              src={user.avatar_url ||
                                `https://ui-avatars.com/api/?name=${
                                  encodeURIComponent(user.name || user.login)
                                }&background=random`}
                              alt={user.login}
                            />
                          </div>
                        </div>
                        <div>
                          <div class="font-bold">{user.name || user.login}</div>
                          <div class="text-sm opacity-50">@{user.login}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="text-sm opacity-70">
                        {user.login}@github.com
                      </span>
                    </td>
                    <td>
                      <select
                        class="select select-bordered select-sm"
                        value={user.role || "free"}
                        disabled={updatingUserId === user.id}
                        onChange={(e) =>
                          updateUserRole(
                            user.id,
                            (e.target as HTMLSelectElement).value,
                          )}
                      >
                        <option value="admin">Admin</option>
                        <option value="subscriber">Subscriber</option>
                        <option value="free">Free</option>
                      </select>
                    </td>
                    <td>
                      <span class="text-sm">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td>
                      {user.blocked ? (
                        <span class="badge badge-error">Blocked</span>
                      ) : (
                        <span class="badge badge-success">Active</span>
                      )}
                    </td>
                    <td>
                      <button
                        class={`btn btn-sm ${
                          user.blocked ? "btn-success" : "btn-error"
                        }`}
                        disabled={updatingUserId === user.id}
                        onClick={() =>
                          toggleBlockUser(user.id, user.blocked || false)}
                      >
                        {updatingUserId === user.id
                          ? (
                            <span class="loading loading-spinner loading-xs">
                            </span>
                          )
                          : user.blocked
                          ? "Unblock"
                          : "Block"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div class="text-sm opacity-60 mt-4">
          Total users: {users.length}
        </div>
      </div>
    </div>
  );
}
