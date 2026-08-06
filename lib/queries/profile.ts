import { getSession } from "@/lib/session";

/** users already carries every "profile" field — this is just getSession(). */
export async function getCurrentProfile() {
  return getSession();
}
