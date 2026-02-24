/**
 * Hardcoded login users for prototype.
 * One parent and one operator per center; handbook and all views are scoped by center.
 */

export type Role = "parent" | "operator";

export type AuthUser = {
  userKey: string;
  role: Role;
  centerId: number;
  displayName: string;
  /** Short label for the center (e.g. for login dropdown) */
  centerLabel: string;
  /** DB parent id (for parent role) */
  dbParentId?: number;
  /** DB operator id (for operator role) */
  dbOperatorId?: number;
};

/** Password for prototype; same for all logins. Do not use in production. */
export const DEMO_PASSWORD = "demo";

const USERS: AuthUser[] = [
  // Center 1 — Alamosa
  {
    userKey: "parent_alamosa",
    role: "parent",
    centerId: 1,
    centerLabel: "Alamosa",
    displayName: "Maria Garcia",
    dbParentId: 1,
  },
  {
    userKey: "operator_alamosa",
    role: "operator",
    centerId: 1,
    centerLabel: "Alamosa",
    displayName: "Director Sarah",
    dbOperatorId: 1,
  },
  // Center 2 — Lowell
  {
    userKey: "parent_lowell",
    role: "parent",
    centerId: 2,
    centerLabel: "Lowell",
    displayName: "James Chen",
    dbParentId: 2,
  },
  {
    userKey: "operator_lowell",
    role: "operator",
    centerId: 2,
    centerLabel: "Lowell",
    displayName: "Director Lisa",
    dbOperatorId: 2,
  },
  // Center 3 — Plaza Feliz
  {
    userKey: "parent_plaza",
    role: "parent",
    centerId: 3,
    centerLabel: "Plaza Feliz",
    displayName: "Ana Martinez",
    dbParentId: 3,
  },
  {
    userKey: "operator_plaza",
    role: "operator",
    centerId: 3,
    centerLabel: "Plaza Feliz",
    displayName: "Director Mike",
    dbOperatorId: 3,
  },
];

export function getAuthUserByKey(userKey: string): AuthUser | null {
  return USERS.find((u) => u.userKey === userKey) ?? null;
}

export function getAuthUserByKeyAndPassword(
  userKey: string,
  password: string
): AuthUser | null {
  if (password !== DEMO_PASSWORD) return null;
  return getAuthUserByKey(userKey);
}

export function listLoginOptions(): {
  userKey: string;
  displayName: string;
  role: Role;
  centerLabel: string;
  dbParentId?: number;
  dbOperatorId?: number;
}[] {
  return USERS.map((u) => ({
    userKey: u.userKey,
    displayName: u.displayName,
    role: u.role,
    centerLabel: u.centerLabel,
    dbParentId: u.dbParentId,
    dbOperatorId: u.dbOperatorId,
  }));
}
