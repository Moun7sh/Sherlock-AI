import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret";

describe("JWT token generation", () => {
  it("creates a valid access token", () => {
    const token = jwt.sign({ sub: "user-1", role: "INSPECTOR" }, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("INSPECTOR");
  });

  it("rejects expired tokens", () => {
    const token = jwt.sign({ sub: "user-1", role: "INSPECTOR" }, JWT_SECRET, { expiresIn: "0s" });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });

  it("rejects tokens with wrong secret", () => {
    const token = jwt.sign({ sub: "user-1", role: "INSPECTOR" }, JWT_SECRET);
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });
});
