/**
 * Unit Conversion Utilities
 *
 * STORAGE STRATEGY:
 * - Weight: stored in GRAMS (base unit). 1 kg = 1000 g.
 * - Volume: stored in MILLILITERS (base unit). 1 L = 1000 mL.
 * - Count:  stored as individual UNITS.
 *
 * PRICE STORAGE:
 * - All prices stored in PAISE (integer). 1 INR = 100 paise.
 * - pricePerBaseUnit = paise per gram | paise per mL | paise per unit
 * - Using integers eliminates floating-point rounding errors.
 *
 * CONVERSION FACTORS:
 * - kg  <-> g   : 1 kg = 1000 g
 * - L   <-> mL  : 1 L  = 1000 mL
 * - g   <-> g   : 1 (identity)
 * - mL  <-> mL  : 1 (identity)
 * - unit<-> unit: 1 (identity)
 */

export type DisplayUnit = "g" | "kg" | "mL" | "L" | "unit";
export type BaseUnit = "GRAM" | "MILLILITER" | "UNIT";

/** How many base units are in 1 of the given display unit */
export const CONVERSION_FACTORS: Record<DisplayUnit, number> = {
  g: 1,       // 1 g = 1 gram
  kg: 1000,   // 1 kg = 1000 grams
  mL: 1,      // 1 mL = 1 mL
  L: 1000,    // 1 L = 1000 mL
  unit: 1,    // 1 unit = 1 unit
};

/** Which display units are valid for each base unit */
export const VALID_UNITS_FOR_BASE: Record<BaseUnit, DisplayUnit[]> = {
  GRAM: ["g", "kg"],
  MILLILITER: ["mL", "L"],
  UNIT: ["unit"],
};

/** Convert an ordered quantity (in display unit) to base units */
export function toBaseUnits(qty: number, unit: DisplayUnit): number {
  return qty * CONVERSION_FACTORS[unit];
}

/** Convert a base-unit quantity to a display unit */
export function fromBaseUnits(baseQty: number, unit: DisplayUnit): number {
  return baseQty / CONVERSION_FACTORS[unit];
}

/**
 * Calculate price for a given qty in a display unit.
 * pricePerBaseUnit is in paise.
 * Returns total in paise (integer).
 */
export function calculateLineTotalPaise(
  qty: number,
  unit: DisplayUnit,
  pricePerBaseUnitPaise: number
): number {
  const baseQty = toBaseUnits(qty, unit);
  return Math.round(baseQty * pricePerBaseUnitPaise);
}

/**
 * Calculate the effective price per display unit in paise.
 * e.g., if pricePerBaseUnit = 2 paise/g, and unit = "kg",
 * then pricePerKg = 2 * 1000 = 2000 paise = ₹20/kg
 */
export function pricePerDisplayUnit(
  unit: DisplayUnit,
  pricePerBaseUnitPaise: number
): number {
  return CONVERSION_FACTORS[unit] * pricePerBaseUnitPaise;
}

/** Format paise as INR string e.g. 150000 -> "₹1,500.00" */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(rupees);
}

/** Get a human-readable label for a base unit */
export function baseUnitLabel(baseUnit: BaseUnit): string {
  switch (baseUnit) {
    case "GRAM":       return "g";
    case "MILLILITER": return "mL";
    case "UNIT":       return "unit";
  }
}

/** Get the default display unit for a base unit */
export function defaultDisplayUnit(baseUnit: BaseUnit): DisplayUnit {
  switch (baseUnit) {
    case "GRAM":       return "g";
    case "MILLILITER": return "mL";
    case "UNIT":       return "unit";
  }
}
