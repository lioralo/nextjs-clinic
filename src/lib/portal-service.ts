import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { sendMail } from "./mail";
import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";

function generateTempPassword() {
  return `P-${randomBytes(6).toString("base64url")}`;
}

export async function grantPortalAccess(input: {
  patientId: string;
  username?: string;
  email?: string | null;
}) {
  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    include: { portalUser: true },
  });
  if (!patient) return { ok: false as const, error: "invalid" };

  const username =
    input.username?.trim() ||
    patient.portalUser?.username ||
    `${patient.firstName}.${patient.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "");
  if (!username) return { ok: false as const, error: "username" };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const email = input.email?.trim() || patient.email || null;

  if (patient.portalUser) {
    await prisma.user.update({
      where: { id: patient.portalUser.id },
      data: {
        username,
        email,
        passwordHash,
        forcePasswordChange: true,
        isActive: true,
        role: "PATIENT",
        patientId: patient.id,
      },
    });
  } else {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) return { ok: false as const, error: "username" };
    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        forcePasswordChange: true,
        isActive: true,
        role: "PATIENT",
        patientId: patient.id,
      },
    });
  }

  if (email) {
    await sendMail({
      to: email,
      subject: "Clinic portal access",
      text: `Your clinic portal username is ${username}. Temporary password: ${tempPassword}`,
    });
  }

  revalidateClinic(patient.id);
  return { ok: true as const, username, tempPassword };
}

export async function changePortalPassword(userId: string, password: string) {
  if (password.trim().length < 8) {
    return { ok: false as const, error: "weak" };
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      forcePasswordChange: false,
    },
  });
  return { ok: true as const };
}

export async function getPortalPatient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true },
  });
  if (!user || user.role !== "PATIENT" || !user.patient) return null;
  return { user, patient: user.patient };
}
