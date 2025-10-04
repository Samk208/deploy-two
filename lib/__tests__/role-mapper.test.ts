import { describe, it, expect } from "vitest";
import {
  mapOnboardingRoleToDbRole,
  mapDbRoleToOnboardingRole,
  isOnboardingRole,
  isDbRole,
} from "../role-mapper";

describe("role-mapper", () => {
  describe("mapOnboardingRoleToDbRole", () => {
    it("maps brand to supplier", () => {
      expect(mapOnboardingRoleToDbRole("brand")).toBe("supplier");
    });

    it("maps influencer to influencer", () => {
      expect(mapOnboardingRoleToDbRole("influencer")).toBe("influencer");
    });
  });

  describe("mapDbRoleToOnboardingRole", () => {
    it("maps supplier to brand", () => {
      expect(mapDbRoleToOnboardingRole("supplier")).toBe("brand");
    });

    it("maps influencer to influencer", () => {
      expect(mapDbRoleToOnboardingRole("influencer")).toBe("influencer");
    });

    it("returns null for admin", () => {
      expect(mapDbRoleToOnboardingRole("admin")).toBeNull();
    });

    it("returns null for customer", () => {
      expect(mapDbRoleToOnboardingRole("customer")).toBeNull();
    });
  });

  describe("isOnboardingRole", () => {
    it("returns true for brand", () => {
      expect(isOnboardingRole("brand")).toBe(true);
    });

    it("returns true for influencer", () => {
      expect(isOnboardingRole("influencer")).toBe(true);
    });

    it("returns false for supplier", () => {
      expect(isOnboardingRole("supplier")).toBe(false);
    });

    it("returns false for admin", () => {
      expect(isOnboardingRole("admin")).toBe(false);
    });
  });

  describe("isDbRole", () => {
    it("returns true for all valid db roles", () => {
      expect(isDbRole("supplier")).toBe(true);
      expect(isDbRole("influencer")).toBe(true);
      expect(isDbRole("admin")).toBe(true);
      expect(isDbRole("customer")).toBe(true);
    });

    it("returns false for onboarding-only roles", () => {
      expect(isDbRole("brand")).toBe(false);
    });

    it("returns false for invalid roles", () => {
      expect(isDbRole("random")).toBe(false);
    });
  });
});
