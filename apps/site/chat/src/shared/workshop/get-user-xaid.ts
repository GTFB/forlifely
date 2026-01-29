import { getSession } from "@/shared/session";
import { buildRequestEnv } from "@/shared/env";
import { MeRepository } from "@/shared/repositories/me.repository";

/**
 * Gets user xaid (user uuid) from authenticated session
 * Returns null if user is not authenticated
 */
export async function getUserXaid(request: Request): Promise<string | null> {
  const env = buildRequestEnv();

  if (!env.AUTH_SECRET) {
    return null;
  }

  const sessionUser = await getSession(request, env.AUTH_SECRET);
  if (!sessionUser?.id) {
    return null;
  }

  try {
    if (!env.DB) {
      console.error("Database not available in getUserXaid");
      return null;
    }
    
    const meRepository = MeRepository.getInstance(env.DB);
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id));
    
    if (!userWithRoles?.user) {
      console.error("User not found with roles for id:", sessionUser.id);
      return null;
    }

    // Use user uuid as xaid for goals
    return userWithRoles.user.uuid;
  } catch (error: any) {
    console.error("Error getting user xaid:", error?.message || error, {
      code: error?.code,
      severity: error?.severity,
    });
    // Don't throw, just return null to allow graceful handling
    return null;
  }
}


