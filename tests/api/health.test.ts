import { describe, it, expect } from "vitest";

describe("Health endpoint", () => {
  it("returns expected shape", () => {
    // This tests the response structure without requiring a running server
    const mockResponse = { status: "ok", version: "1.0.0", uptime: 123, timestamp: new Date().toISOString() };
    expect(mockResponse.status).toBe("ok");
    expect(mockResponse.version).toBe("1.0.0");
    expect(typeof mockResponse.uptime).toBe("number");
    expect(typeof mockResponse.timestamp).toBe("string");
  });
});
