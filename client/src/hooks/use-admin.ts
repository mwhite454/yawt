import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import type { User } from "@/types/user";

const adminKeys = {
  users: ["admin", "users"] as const,
};

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: adminApi.listUsers,
  });
}

export function useUpdateUserRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: User["role"] }) =>
      adminApi.updateRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users }),
  });
}

export function useSetUserBlockedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: number; blocked: boolean }) =>
      adminApi.setBlocked(userId, blocked),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users }),
  });
}
