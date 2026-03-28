import { api } from "@/lib/api";
import type { User } from "@/types/user";

interface AdminUser extends User {
  role: NonNullable<User["role"]>;
}

export const adminApi = {
  listUsers: () => api.get<AdminUser[]>("/api/admin/users"),
  updateRole: (userId: number, role: User["role"]) =>
    api.patch<AdminUser>("/api/admin/users", { userId, role }),
  setBlocked: (userId: number, blocked: boolean) =>
    api.put<AdminUser>("/api/admin/users", { userId, blocked }),
};
