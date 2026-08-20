import type { NotificationCategory } from "@prisma/client";

import { prisma } from "./prisma";

export async function listStaffUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "CLINICIAN"] }, isActive: true },
    orderBy: { username: "asc" },
  });
}

export async function getPrimaryStaffUser() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (admin) return admin;
  return prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "CLINICIAN"] }, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPortalUsers() {
  return prisma.user.findMany({
    where: { role: "PATIENT", isActive: true, patientId: { not: null } },
    include: { patient: true },
    orderBy: { username: "asc" },
  });
}

export async function sendMessage(input: {
  senderId: string;
  recipientId: string;
  body: string;
}) {
  const body = input.body.trim();
  if (!body) return { ok: false as const, error: "empty" };
  const created = await prisma.message.create({
    data: {
      senderId: input.senderId,
      recipientId: input.recipientId,
      body,
    },
  });
  return { ok: true as const, id: created.id };
}

export async function listThread(userId: string, otherUserId: string) {
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  await prisma.message.updateMany({
    where: { senderId: otherUserId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return rows;
}

export async function listStaffConversations(staffUserId: string) {
  const portals = await listPortalUsers();
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: staffUserId }, { recipientId: staffUserId }],
    },
    orderBy: { createdAt: "desc" },
  });
  return portals.map((portal) => {
    const thread = messages.filter(
      (row) =>
        (row.senderId === portal.id && row.recipientId === staffUserId) ||
        (row.senderId === staffUserId && row.recipientId === portal.id)
    );
    const unread = thread.filter(
      (row) => row.recipientId === staffUserId && !row.readAt
    ).length;
    return {
      user: portal,
      lastMessage: thread[0] ?? null,
      unread,
    };
  });
}

export async function createNotification(input: {
  recipientUserId: string;
  title: string;
  body: string;
  category?: NotificationCategory;
}) {
  return prisma.notification.create({
    data: {
      recipientUserId: input.recipientUserId,
      title: input.title,
      body: input.body,
      category: input.category ?? "SYSTEM",
    },
  });
}

export async function notifyStaff(input: {
  title: string;
  body: string;
  category?: NotificationCategory;
}) {
  const staff = await listStaffUsers();
  await prisma.notification.createMany({
    data: staff.map((user) => ({
      recipientUserId: user.id,
      title: input.title,
      body: input.body,
      category: input.category ?? "SYSTEM",
    })),
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { recipientUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientUserId: userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function broadcastNotification(input: {
  title: string;
  body: string;
}) {
  const portals = await listPortalUsers();
  if (portals.length === 0) return { ok: true as const, count: 0 };
  await prisma.notification.createMany({
    data: portals.map((user) => ({
      recipientUserId: user.id,
      title: input.title,
      body: input.body,
      category: "ADMIN_BROADCAST" as const,
    })),
  });
  return { ok: true as const, count: portals.length };
}
