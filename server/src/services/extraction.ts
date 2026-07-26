/**
 * Entity extraction from text.
 * This runs offline using pattern matching.
 * For production, replace with spaCy/NER via a Python microservice.
 */

interface ExtractedEntities {
  dates: string[];
  phoneNumbers: string[];
  vehicleRegistrations: string[];
  amounts: string[];
  locations: string[];
  persons: string[];
  weapons: string[];
}

export function extractEntities(text: string): ExtractedEntities {
  const dates = [...new Set(text.match(/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/g) || [])];
  const phoneNumbers = [...new Set(text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g) || [])];
  const vehicleRegistrations = [...new Set(
    text.match(/[A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,2}[\s-]?\d{4}/gi) || []
  )].map(v => v.toUpperCase());
  const amounts = [...new Set(
    text.match(/(?:Rs\.?|₹|INR)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:lakh|lakhs|crore|crores|L|Cr))?/gi) || []
  )];
  // Also match standalone large numbers with commas (Indian format)
  const indianAmounts = text.match(/\b\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?\b/g)?.filter(n => {
    const num = parseFloat(n.replace(/,/g, ""));
    return num >= 10000;
  }) || [];
  amounts.push(...indianAmounts.map(a => `₹${a}`));
  const weaponPatterns = /(?:knife|pistol|revolver|gun|firearm|sharp weapon|dagger|sword|axe|rod|machete|country[\s-]?made)/gi;
  const weapons = [...new Set((text.match(weaponPatterns) || []).map(w => w.toLowerCase()))];

  // Simple location extraction (Karnataka districts and common place patterns)
  const karnatakPlaces = [
    "Mysuru", "Mysore", "Bengaluru", "Bangalore", "Mandya", "Hassan", "Mangaluru", "Mangalore",
    "Hubballi", "Hubli", "Belagavi", "Belgaum", "Kalaburagi", "Gulbarga", "Shimoga", "Shivamogga",
    "Davangere", "Tumkur", "Tumakuru", "Raichur", "Bellary", "Udupi", "Chikmagalur",
  ];
  const locations = karnatakPlaces.filter(p => text.toLowerCase().includes(p.toLowerCase()));
  // Road/area patterns
  const roadMatches = text.match(/(?:[\w\s]+(?:Road|Rd|Street|Lane|Cross|Main|Circle|Nagar|Puram|Pura|Layout))/g) || [];
  locations.push(...roadMatches.map(r => r.trim()).filter(r => r.length > 4 && r.length < 60));

  // Person names (simple: Title + capitalized words)
  const personMatches = text.match(/(?:Mr|Mrs|Ms|Shri|Smt|Sri)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}/g) || [];
  const persons = [...new Set(personMatches.map(p => p.trim()))];

  return { dates, phoneNumbers, vehicleRegistrations, amounts, locations: [...new Set(locations)], persons, weapons };
}

/**
 * OCR stub — when Tesseract is available, this processes images/PDFs.
 * Install: apt-get install tesseract-ocr && npm install tesseract.js
 * Then uncomment the implementation below.
 */
export async function ocrExtract(filePath: string): Promise<string | null> {
  try {
    // @ts-expect-error — tesseract.js is an optional dependency, not in devDeps
    const Tesseract = await import("tesseract.js").catch(() => null);
    if (!Tesseract) {
      console.log("  [OCR] tesseract.js not installed — skipping OCR");
      return null;
    }
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    return text;
  } catch (err) {
    console.log("  [OCR] extraction failed:", (err as Error).message);
    return null;
  }
}
