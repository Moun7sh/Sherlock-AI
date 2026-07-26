import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("  Seeding Sherlock AI database...\n");

  // ── Users ──
  const pw = await bcrypt.hash("sherlock2026", 12);
  const users = await Promise.all([
    prisma.user.upsert({ where: { badgeNumber: "KSP-4471" }, update: {}, create: {
      badgeNumber: "KSP-4471", name: "Inspector K. Venkatesh", email: "venkatesh@ksp.gov.in",
      passwordHash: pw, role: "INSPECTOR", rank: "Inspector", department: "CID", station: "CID Bengaluru" } }),
    prisma.user.upsert({ where: { badgeNumber: "KSP-1001" }, update: {}, create: {
      badgeNumber: "KSP-1001", name: "SP Lakshmi Narayana", email: "sp.lakshmi@ksp.gov.in",
      passwordHash: pw, role: "SUPERINTENDENT", rank: "Superintendent", department: "CID", station: "SP Office Mysuru" } }),
    prisma.user.upsert({ where: { badgeNumber: "KSP-9999" }, update: {}, create: {
      badgeNumber: "KSP-9999", name: "Admin", email: "admin@ksp.gov.in",
      passwordHash: pw, role: "ADMIN", rank: "DIG", department: "IT", station: "HQ Bengaluru" } }),
  ]);
  console.log(`  ✓ ${users.length} users`);

  // ── Persons (suspects) ──
  const persons = await Promise.all([
    prisma.person.upsert({ where: { id: "person-ravi" }, update: {}, create: {
      id: "person-ravi", name: "Ravi Kumar", alias: "Ravi", age: 31, gender: "Male",
      address: "Bannur Road, Mysuru", threatLevel: "HIGH", priorCount: 12 } }),
    prisma.person.upsert({ where: { id: "person-imran" }, update: {}, create: {
      id: "person-imran", name: "Imran Sheikh", alias: "Chotu", age: 28, gender: "Male",
      address: "Mandya Town", threatLevel: "HIGH", priorCount: 7 } }),
    prisma.person.upsert({ where: { id: "person-manju" }, update: {}, create: {
      id: "person-manju", name: "Manjunath Gowda", alias: "Manju", age: 34, gender: "Male",
      address: "Hunsur Road, Mysuru", threatLevel: "CRITICAL", priorCount: 19 } }),
    prisma.person.upsert({ where: { id: "person-anita" }, update: {}, create: {
      id: "person-anita", name: "Anita D Souza", alias: "Fence", age: 44, gender: "Female",
      address: "Mangaluru North", threatLevel: "MEDIUM", priorCount: 4 } }),
    prisma.person.upsert({ where: { id: "person-firoz" }, update: {}, create: {
      id: "person-firoz", name: "Firoz Khan", alias: "FK", age: 26, gender: "Male",
      address: "Hassan Town", threatLevel: "MEDIUM", priorCount: 3 } }),
    prisma.person.upsert({ where: { id: "person-victim1" }, update: {}, create: {
      id: "person-victim1", name: "Rajesh Shetty", age: 45, gender: "Male",
      address: "Sayyaji Rao Road, Mysuru", threatLevel: "LOW" } }),
  ]);
  console.log(`  ✓ ${persons.length} persons`);

  // ── Vehicles ──
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({ where: { registration: "KA-09-MH-1234" }, update: {}, create: {
      id: "veh-fortuner", registration: "KA-09-MH-1234", make: "Toyota", model: "Fortuner",
      color: "White", type: "SUV", ownerName: "Fictitious Registration" } }),
    prisma.vehicle.upsert({ where: { registration: "KA-05-AB-9911" }, update: {}, create: {
      id: "veh-pulsar", registration: "KA-05-AB-9911", make: "Bajaj", model: "Pulsar",
      color: "Black", type: "Motorcycle" } }),
  ]);
  console.log(`  ✓ ${vehicles.length} vehicles`);

  // ── Phones ──
  const phones = await Promise.all([
    prisma.phoneNumber.upsert({ where: { number: "+91-98450-71xxx" }, update: {}, create: {
      id: "phone-1", number: "+91-98450-71xxx", carrier: "Airtel" } }),
    prisma.phoneNumber.upsert({ where: { number: "+91-99016-42xxx" }, update: {}, create: {
      id: "phone-2", number: "+91-99016-42xxx", carrier: "Jio" } }),
    prisma.phoneNumber.upsert({ where: { number: "+91-90084-90xxx" }, update: {}, create: {
      id: "phone-3", number: "+91-90084-90xxx", carrier: "Vi" } }),
  ]);
  console.log(`  ✓ ${phones.length} phones`);

  // ── Bank ──
  await prisma.bankAccount.upsert({ where: { id: "bank-sbi" }, update: {}, create: {
    id: "bank-sbi", bankName: "SBI", branch: "Sayyaji Rao Road, Mysuru", holderName: "Manjunath Gowda" } });

  // ── Cases (FIRs) ──
  const cases = await Promise.all([
    prisma.case.upsert({ where: { firNumber: "0142/2026" }, update: {}, create: {
      id: "case-f1", firNumber: "0142/2026", title: "Armed robbery — jewellery courier",
      description: "Two masked men intercepted a jewellery courier near Sayyaji Rao Road. A white SUV was seen fleeing towards Bannur Road.",
      crimeType: "Robbery", ipcSections: ["392", "397"], status: "UNDER_INVESTIGATION", priority: "HIGH",
      station: "Devaraja PS", district: "Mysuru", place: "Sayyaji Rao Road, Mysuru",
      latitude: 12.3051, longitude: 76.6551, dateOfOffence: new Date("2026-01-12"), timeOfOffence: "21:40",
      dateOfFiling: new Date("2026-01-12"), estimatedLoss: "18.4L",
      summary: "Jewellery courier robbed at knifepoint. White Toyota Fortuner used as getaway vehicle." } }),
    prisma.case.upsert({ where: { firNumber: "0219/2026" }, update: {}, create: {
      id: "case-f2", firNumber: "0219/2026", title: "Highway robbery — cash van",
      description: "A cash van was forced to stop on NH-275. A white Fortuner blocked the road. One accused fled on a black motorcycle.",
      crimeType: "Robbery", ipcSections: ["392", "397", "34"], status: "UNDER_INVESTIGATION", priority: "HIGH",
      station: "Mandya Town PS", district: "Mandya", place: "NH-275, Mandya",
      latitude: 12.5222, longitude: 76.8952, dateOfOffence: new Date("2026-02-03"), timeOfOffence: "22:15",
      dateOfFiling: new Date("2026-02-04"), estimatedLoss: "9.2L" } }),
    prisma.case.upsert({ where: { firNumber: "0301/2026" }, update: {}, create: {
      id: "case-f4", firNumber: "0301/2026", title: "Seizure — melted gold",
      description: "During a routine check, melted gold suspected to be from Mysuru robbery recovered from a jeweller-fence.",
      crimeType: "Receiving stolen property", ipcSections: ["411"], status: "OPEN", priority: "MEDIUM",
      station: "Mangaluru North PS", district: "Mangaluru", place: "Mangaluru North",
      latitude: 12.8714, longitude: 74.8425, dateOfOffence: new Date("2026-02-24"), timeOfOffence: "13:20",
      dateOfFiling: new Date("2026-02-24") } }),
    prisma.case.upsert({ where: { firNumber: "0355/2026" }, update: {}, create: {
      id: "case-f5", firNumber: "0355/2026", title: "Armed robbery — pawn shop",
      description: "Pawn shop looted at closing time. Same white SUV pattern. Rs 40,000 ATM withdrawal made minutes earlier nearby.",
      crimeType: "Robbery", ipcSections: ["392", "397", "34"], status: "UNDER_INVESTIGATION", priority: "CRITICAL",
      station: "Hassan Town PS", district: "Hassan", place: "Hassan Town",
      latitude: 13.0073, longitude: 76.1004, dateOfOffence: new Date("2026-03-08"), timeOfOffence: "20:50",
      dateOfFiling: new Date("2026-03-08"), estimatedLoss: "22.7L" } }),
  ]);
  console.log(`  ✓ ${cases.length} cases`);

  // ── Link suspects to cases ──
  await Promise.all([
    prisma.caseSuspect.upsert({ where: { caseId_personId: { caseId: "case-f1", personId: "person-ravi" } },
      update: {}, create: { caseId: "case-f1", personId: "person-ravi", role: "ACCUSED" } }),
    prisma.caseSuspect.upsert({ where: { caseId_personId: { caseId: "case-f2", personId: "person-imran" } },
      update: {}, create: { caseId: "case-f2", personId: "person-imran", role: "ACCUSED" } }),
    prisma.caseSuspect.upsert({ where: { caseId_personId: { caseId: "case-f4", personId: "person-anita" } },
      update: {}, create: { caseId: "case-f4", personId: "person-anita", role: "ACCUSED" } }),
    prisma.caseSuspect.upsert({ where: { caseId_personId: { caseId: "case-f5", personId: "person-manju" } },
      update: {}, create: { caseId: "case-f5", personId: "person-manju", role: "ACCUSED" } }),
    prisma.caseSuspect.upsert({ where: { caseId_personId: { caseId: "case-f1", personId: "person-victim1" } },
      update: {}, create: { caseId: "case-f1", personId: "person-victim1", role: "VICTIM" } }),
  ]);

  // ── Link vehicles ──
  await Promise.all([
    prisma.caseVehicle.upsert({ where: { caseId_vehicleId: { caseId: "case-f1", vehicleId: "veh-fortuner" } },
      update: {}, create: { caseId: "case-f1", vehicleId: "veh-fortuner", context: "Seen fleeing" } }),
    prisma.caseVehicle.upsert({ where: { caseId_vehicleId: { caseId: "case-f2", vehicleId: "veh-fortuner" } },
      update: {}, create: { caseId: "case-f2", vehicleId: "veh-fortuner", context: "Blocked road" } }),
    prisma.caseVehicle.upsert({ where: { caseId_vehicleId: { caseId: "case-f5", vehicleId: "veh-fortuner" } },
      update: {}, create: { caseId: "case-f5", vehicleId: "veh-fortuner", context: "Seen at scene" } }),
  ]);

  // ── Link phones ──
  await Promise.all([
    prisma.casePhone.upsert({ where: { caseId_phoneId: { caseId: "case-f1", phoneId: "phone-1" } },
      update: {}, create: { caseId: "case-f1", phoneId: "phone-1" } }),
    prisma.casePhone.upsert({ where: { caseId_phoneId: { caseId: "case-f2", phoneId: "phone-2" } },
      update: {}, create: { caseId: "case-f2", phoneId: "phone-2" } }),
    prisma.casePhone.upsert({ where: { caseId_phoneId: { caseId: "case-f5", phoneId: "phone-1" } },
      update: {}, create: { caseId: "case-f5", phoneId: "phone-1" } }),
    prisma.casePhone.upsert({ where: { caseId_phoneId: { caseId: "case-f4", phoneId: "phone-3" } },
      update: {}, create: { caseId: "case-f4", phoneId: "phone-3" } }),
  ]);

  // ── Person-phone links ──
  await Promise.all([
    prisma.personPhone.upsert({ where: { personId_phoneId: { personId: "person-ravi", phoneId: "phone-1" } },
      update: {}, create: { personId: "person-ravi", phoneId: "phone-1" } }),
    prisma.personPhone.upsert({ where: { personId_phoneId: { personId: "person-manju", phoneId: "phone-1" } },
      update: {}, create: { personId: "person-manju", phoneId: "phone-1" } }),
    prisma.personPhone.upsert({ where: { personId_phoneId: { personId: "person-imran", phoneId: "phone-2" } },
      update: {}, create: { personId: "person-imran", phoneId: "phone-2" } }),
    prisma.personPhone.upsert({ where: { personId_phoneId: { personId: "person-anita", phoneId: "phone-3" } },
      update: {}, create: { personId: "person-anita", phoneId: "phone-3" } }),
  ]);

  // ── Bank links ──
  await prisma.caseBankAccount.upsert({ where: { caseId_bankAccountId: { caseId: "case-f5", bankAccountId: "bank-sbi" } },
    update: {}, create: { caseId: "case-f5", bankAccountId: "bank-sbi" } });
  await prisma.bankTransaction.createMany({ data: [
    { bankAccountId: "bank-sbi", amount: 40000, type: "ATM_WITHDRAWAL", location: "SBI ATM Sayyaji Rao Rd", timestamp: new Date("2026-03-08T20:45:00") },
  ], skipDuplicates: true });

  // ── Network links (inferred by AI) ──
  const netLinks = [
    { sourceType: "person", sourceId: "person-ravi", targetType: "vehicle", targetId: "veh-fortuner", relation: "drove", isInferred: true, confidence: 0.92 },
    { sourceType: "person", sourceId: "person-imran", targetType: "vehicle", targetId: "veh-fortuner", relation: "drove", isInferred: true, confidence: 0.88 },
    { sourceType: "person", sourceId: "person-manju", targetType: "vehicle", targetId: "veh-fortuner", relation: "drove", isInferred: true, confidence: 0.95 },
    { sourceType: "person", sourceId: "person-manju", targetType: "phone", targetId: "phone-1", relation: "shares handset", isInferred: true, confidence: 0.90 },
    { sourceType: "phone", sourceId: "phone-1", targetType: "phone", targetId: "phone-2", relation: "14 calls on crime nights", isInferred: true, confidence: 0.96 },
    { sourceType: "phone", sourceId: "phone-1", targetType: "phone", targetId: "phone-3", relation: "6 calls", isInferred: true, confidence: 0.78 },
    { sourceType: "person", sourceId: "person-manju", targetType: "bank", targetId: "bank-sbi", relation: "withdrew 40k before F5", isInferred: true, confidence: 0.97 },
    { sourceType: "person", sourceId: "person-anita", targetType: "vehicle", targetId: "veh-fortuner", relation: "seen near", isInferred: true, confidence: 0.72 },
  ];
  await prisma.networkLink.createMany({ data: netLinks, skipDuplicates: true });
  console.log(`  ✓ ${netLinks.length} network links`);

  // ── Timeline events ──
  const tl = [
    { caseId: "case-f1", timestamp: new Date("2026-01-12T21:40:00"), title: "FIR 0142 filed", eventType: "fir", description: "Jewellery courier robbed near Sayyaji Rao Road. White SUV flees." },
    { caseId: "case-f1", timestamp: new Date("2026-01-13T09:00:00"), title: "Victim statement recorded", eventType: "statement", description: "Courier describes two masked men. Partial reg KA-09-MH-****." },
    { caseId: "case-f2", timestamp: new Date("2026-02-03T22:15:00"), title: "FIR 0219 filed", eventType: "fir", description: "Cash van robbery on NH-275. Same white Fortuner blocks the road." },
    { caseId: "case-f2", timestamp: new Date("2026-02-19T19:05:00"), title: "Tower dump obtained", eventType: "cdr", description: "Handset +91 98450 71xxx pings Mysuru and Mandya on both nights." },
    { caseId: "case-f4", timestamp: new Date("2026-02-24T13:20:00"), title: "Fence seizure — Mangaluru", eventType: "evidence", description: "Melted gold recovered; assay matches FIR 0142." },
    { caseId: "case-f5", timestamp: new Date("2026-03-08T20:45:00"), title: "ATM withdrawal", eventType: "financial", description: "Rs 40,000 pulled 5 min before robbery, 300 m away." },
    { caseId: "case-f5", timestamp: new Date("2026-03-08T20:50:00"), title: "FIR 0355 filed", eventType: "fir", description: "Pawn shop robbery. Same SUV. Handset shared with F1 accused." },
  ];
  await prisma.timelineEvent.createMany({ data: tl, skipDuplicates: true });
  console.log(`  ✓ ${tl.length} timeline events`);

  // ── Notifications ──
  await prisma.notification.createMany({ data: [
    { userId: users[0].id, title: "Network discovered", message: "Hidden criminal network linking 3 FIRs detected", type: "ALERT" },
    { userId: users[0].id, title: "New FIR in queue", message: "FIR 0412/2026 is awaiting intake processing", type: "INFO" },
  ]});
  console.log("  ✓ notifications");

  console.log("\n  ✅ Seed complete\n");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
