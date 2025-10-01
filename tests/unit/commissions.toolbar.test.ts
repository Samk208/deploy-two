import { describe, it, expect } from "vitest";
import { normalizeStatus } from "../../components/dashboard/commissions/toolbar";

describe("CommissionsToolbar.normalizeStatus", () => {
  it("returns undefined for ALL", () => {
    expect(normalizeStatus("ALL")).toBeUndefined();
  });
  it("returns undefined for empty/undefined/null", () => {
    expect(normalizeStatus("" as any)).toBeUndefined();
    expect(normalizeStatus(undefined)).toBeUndefined();
    expect(normalizeStatus(null as any)).toBeUndefined();
  });
  it("passes through valid statuses", () => {
    expect(normalizeStatus("pending")).toBe("pending");
    expect(normalizeStatus("approved")).toBe("approved");
    expect(normalizeStatus("paid")).toBe("paid");
    expect(normalizeStatus("rejected")).toBe("rejected");
  });
});
