import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin-password";

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "ADMIN",
      },
    });
  }

  const sample = await prisma.patient.findFirst({
    where: { firstName: "Test", lastName: "Patient" },
  });
  let patient = sample;
  if (!sample) {
    patient = await prisma.patient.create({
      data: {
        firstName: "Test",
        lastName: "Patient",
        phone: "0500000000",
        email: "test.patient@example.com",
        notesText: "Seeded sample patient for e2e.",
        status: "ONGOING",
        patientType: "PRIVATE",
      },
    });
  } else {
    patient = await prisma.patient.update({
      where: { id: sample.id },
      data: {
        status: "ONGOING",
        patientType: "PRIVATE",
        email: sample.email ?? "test.patient@example.com",
      },
    });
  }

  if (patient) {
    const portalUsername = "portal";
    const existingPortal = await prisma.user.findUnique({
      where: { username: portalUsername },
    });
    if (!existingPortal) {
      await prisma.user.create({
        data: {
          username: portalUsername,
          passwordHash: await bcrypt.hash("portal-password", 12),
          role: "PATIENT",
          patientId: patient.id,
          email: patient.email,
          forcePasswordChange: false,
          isActive: true,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
