/**
 * Role Mapping Utility
 * 
 * Handles conversion between onboarding role labels and database role values.
 * This ensures consistency across the application.
 */

export type OnboardingRole = "brand" | "influencer"
export type DbRole = "supplier" | "influencer" | "admin" | "customer"

/**
 * Maps onboarding role selection to database role value
 * 
 * @param role - The role selected during onboarding ("brand" or "influencer")
 * @returns The corresponding database role value
 * 
 * @example
 * mapOnboardingRoleToDbRole("brand") // Returns "supplier"
 * mapOnboardingRoleToDbRole("influencer") // Returns "influencer"
 */
export function mapOnboardingRoleToDbRole(role: OnboardingRole): DbRole {
  return role === "brand" ? "supplier" : "influencer"
}

/**
 * Maps database role to onboarding role (for reverse operations)
 * Useful when loading saved onboarding progress
 * 
 * @param role - Database role value
 * @returns Onboarding role label, or null if not applicable
 */
export function mapDbRoleToOnboardingRole(role: DbRole): OnboardingRole | null {
  switch (role) {
    case "supplier":
      return "brand"
    case "influencer":
      return "influencer"
    default:
      return null // admin and customer don't have onboarding roles
  }
}

/**
 * Validates if a role string is a valid onboarding role
 */
export function isOnboardingRole(role: string): role is OnboardingRole {
  return role === "brand" || role === "influencer"
}

/**
 * Validates if a role string is a valid database role
 */
export function isDbRole(role: string): role is DbRole {
  return ["supplier", "influencer", "admin", "customer"].includes(role)
}
