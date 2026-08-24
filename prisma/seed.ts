import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { ensureAssessmentTypes } from "../src/lib/assessment-service";

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin-password";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log(`Created staff user "${username}"`);
  } else {
    await prisma.user.update({
      where: { username },
      data: {
        passwordHash,
        isActive: true,
        role: existing.role === "PATIENT" ? existing.role : "ADMIN",
        totpEnabled: false,
        totpSecret: null,
        totpRecoveryHashes: null,
      },
    });
    console.log(`Reset password for staff user "${username}"`);
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
    const portalHash = await bcrypt.hash("portal-password", 12);
    const existingPortal = await prisma.user.findUnique({
      where: { username: portalUsername },
    });
    if (!existingPortal) {
      await prisma.user.create({
        data: {
          username: portalUsername,
          passwordHash: portalHash,
          role: "PATIENT",
          patientId: patient.id,
          email: patient.email,
          forcePasswordChange: false,
          isActive: true,
        },
      });
      console.log(`Created portal user "${portalUsername}"`);
    } else {
      await prisma.user.update({
        where: { username: portalUsername },
        data: {
          passwordHash: portalHash,
          isActive: true,
          forcePasswordChange: false,
          totpEnabled: false,
          totpSecret: null,
          totpRecoveryHashes: null,
        },
      });
      console.log(`Reset password for portal user "${portalUsername}"`);
    }
  }

  await ensureAssessmentTypes();
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
