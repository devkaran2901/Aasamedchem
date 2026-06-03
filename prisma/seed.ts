import { PrismaClient, Role, BaseUnit } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@aasachemchem.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@aasachemchem.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  // Create seller user
  const sellerHash = await bcrypt.hash("seller123", 12);
  const seller = await prisma.user.upsert({
    where: { email: "seller@aasachemchem.com" },
    update: {},
    create: {
      name: "Test Seller",
      email: "seller@aasachemchem.com",
      passwordHash: sellerHash,
      role: Role.SELLER,
    },
  });

  // Create products
  const products = [
    {
      name: "Sodium Chloride (NaCl)",
      sku: "CHEM-NaCl-001",
      description: "Analytical grade sodium chloride, 99.9% purity",
      category: "Inorganic Salts",
      baseUnit: BaseUnit.GRAM,
      pricePerBaseUnit: 2, // 2 paise per gram = ₹2/kg effectively at scale
      stockInBaseUnit: "50000", // 50 kg in grams
    },
    {
      name: "Ethanol (96%)",
      sku: "CHEM-EtOH-001",
      description: "Laboratory grade ethanol, 96% concentration",
      category: "Solvents",
      baseUnit: BaseUnit.MILLILITER,
      pricePerBaseUnit: 3, // 3 paise per mL = ₹30/L
      stockInBaseUnit: "20000", // 20 L in mL
    },
    {
      name: "Hydrochloric Acid (HCl)",
      sku: "CHEM-HCl-001",
      description: "Concentrated HCl, 37% w/v",
      category: "Acids",
      baseUnit: BaseUnit.MILLILITER,
      pricePerBaseUnit: 8, // 8 paise per mL = ₹80/L
      stockInBaseUnit: "10000", // 10 L in mL
    },
    {
      name: "Glucose (Dextrose)",
      sku: "CHEM-Gluc-001",
      description: "Pharmaceutical grade D-glucose monohydrate",
      category: "Sugars",
      baseUnit: BaseUnit.GRAM,
      pricePerBaseUnit: 5, // 5 paise per gram = ₹5/g
      stockInBaseUnit: "25000", // 25 kg in grams
    },
    {
      name: "Acetone",
      sku: "CHEM-Acet-001",
      description: "HPLC grade acetone",
      category: "Solvents",
      baseUnit: BaseUnit.MILLILITER,
      pricePerBaseUnit: 6, // 6 paise per mL = ₹60/L
      stockInBaseUnit: "15000", // 15 L in mL
    },
    {
      name: "Calcium Carbonate",
      sku: "CHEM-CaCO3-001",
      description: "Pharma grade calcium carbonate powder",
      category: "Inorganic Salts",
      baseUnit: BaseUnit.GRAM,
      pricePerBaseUnit: 1, // 1 paise per gram
      stockInBaseUnit: "100000", // 100 kg in grams
    },
    {
      name: "Disposable Gloves (Box)",
      sku: "PPE-Glove-001",
      description: "Nitrile disposable gloves, 100 pcs per box",
      category: "PPE",
      baseUnit: BaseUnit.UNIT,
      pricePerBaseUnit: 45000, // ₹450 per box = 45000 paise
      stockInBaseUnit: "200",
    },
    {
      name: "Distilled Water",
      sku: "CHEM-H2O-001",
      description: "Double-distilled water for laboratory use",
      category: "Solvents",
      baseUnit: BaseUnit.MILLILITER,
      pricePerBaseUnit: 1, // 1 paise per mL = ₹10/L
      stockInBaseUnit: "500000", // 500 L in mL
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p as any,
    });
  }

  console.log(
    `✅ Seeded ${products.length} products, admin and seller accounts.`
  );
  console.log("Admin: admin@aasachemchem.com / admin123");
  console.log("Seller: seller@aasachemchem.com / seller123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
