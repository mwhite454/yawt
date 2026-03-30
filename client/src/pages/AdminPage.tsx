import { useNavigate } from "react-router-dom";
import { Shield, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useAdminUsersQuery,
  useUpdateUserRoleMutation,
  useSetUserBlockedMutation,
} from "@/hooks/use-admin";
import type { UserRole } from "@/types/user";

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  if (currentUser && currentUser.role !== "admin") {
    navigate("/");
    return null;
  }

  const { data: users = [], isLoading } = useAdminUsersQuery();
  const updateRole = useUpdateUserRoleMutation();
  const setBlocked = useSetUserBlockedMutation();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading users…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 border-b border-white/10 px-1 pb-2">
        <div className="panel-title">Admin</div>
        <h1 className="text-sm font-semibold text-white">Users</h1>
      </div>

      <Card>
        <CardContent className="pt-2.5">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-500">
                  <th className="px-2 py-2 font-bold uppercase tracking-widest">
                    User
                  </th>
                  <th className="px-2 py-2 font-bold uppercase tracking-widest">
                    Role
                  </th>
                  <th className="px-2 py-2 font-bold uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-2 py-2 font-bold uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 align-middle last:border-b-0"
                  >
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-white/10 bg-gray-800">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.login}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.login}</p>
                          {u.name && (
                            <p className="text-[10px] text-gray-500">
                              {u.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        className="w-32"
                        value={u.role ?? "free"}
                        onChange={(e) =>
                          updateRole.mutate({
                            userId: u.id,
                            role: e.target.value as UserRole,
                          })
                        }
                        disabled={u.id === currentUser?.id}
                      >
                        <option value="free">free</option>
                        <option value="subscriber">subscriber</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      {u.blocked ? (
                        <Badge className="bg-red-600 text-white">Blocked</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-white">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {u.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant={u.blocked ? "outline" : "destructive"}
                          onClick={() =>
                            setBlocked.mutate({
                              userId: u.id,
                              blocked: !u.blocked,
                            })
                          }
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {u.blocked ? "Unblock" : "Block"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
