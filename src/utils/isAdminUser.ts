import { supabase } from "@/lib/supabase";

/**
 * Checa se o usuário é admin na tabela users.
 * @param userId ID do usuário logado
 * @returns boolean
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !user) return false;
  return user.role === "ADMIN";
}