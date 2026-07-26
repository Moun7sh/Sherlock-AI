import { describe, it, expect } from "vitest";
import { extractEntities } from "../../server/src/services/extraction";

describe("extractEntities", () => {
  const sample = `On 12/01/2026 at about 2140 hrs, the complainant Shri Rajesh Shetty was 
  intercepted near Sayyaji Rao Road, Mysore by three unknown persons who arrived in a 
  white SUV bearing registration KA-09-MH-1234. The accused threatened with a sharp weapon 
  and decamped with gold ornaments worth Rs 18,40,000. Contact: 98450-71234.`;

  it("extracts dates", () => {
    const result = extractEntities(sample);
    expect(result.dates).toContain("12/01/2026");
  });

  it("extracts vehicle registrations", () => {
    const result = extractEntities(sample);
    expect(result.vehicleRegistrations).toContain("KA-09-MH-1234");
  });

  it("extracts phone numbers", () => {
    const result = extractEntities(sample);
    expect(result.phoneNumbers.length).toBeGreaterThan(0);
  });

  it("extracts amounts", () => {
    const result = extractEntities(sample);
    expect(result.amounts.length).toBeGreaterThan(0);
    expect(result.amounts.some(a => a.includes("18") || a.includes("40"))).toBe(true);
  });

  it("extracts weapons", () => {
    const result = extractEntities(sample);
    expect(result.weapons).toContain("sharp weapon");
  });

  it("extracts locations", () => {
    const result = extractEntities(sample);
    expect(result.locations.some(l => l.includes("Mysore") || l.includes("Mysuru"))).toBe(true);
  });

  it("extracts persons with titles", () => {
    const result = extractEntities(sample);
    expect(result.persons.some(p => p.includes("Rajesh"))).toBe(true);
  });

  it("handles empty text", () => {
    const result = extractEntities("");
    expect(result.dates).toEqual([]);
    expect(result.phoneNumbers).toEqual([]);
    expect(result.vehicleRegistrations).toEqual([]);
  });
});
