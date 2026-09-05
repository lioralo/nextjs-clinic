import { notifyStaff } from "./messaging-service";
import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";

const contactAttempts = new Map<string, number[]>();

export function tooManyContactSubmissions(key: string, now = Date.now()) {
  const windowStart = now - 60_000;
  const recent = (contactAttempts.get(key) ?? []).filter((stamp) => stamp > windowStart);
  if (recent.length >= 5) {
    contactAttempts.set(key, recent);
    return true;
  }
  recent.push(now);
  contactAttempts.set(key, recent);
  return false;
}

export async function submitContactInquiry(input: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  website?: string;
  clientKey?: string;
}) {
  if (input.website?.trim()) {
    return { ok: true as const, honeypot: true };
  }
  if (tooManyContactSubmissions(input.clientKey?.trim() || "anon")) {
    return { ok: false as const, error: "rate" };
  }

  const name = input.name.trim();
  const message = input.message.trim();
  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;
  if (!name || !message) return { ok: false as const, error: "required" };
  if (!email && !phone) return { ok: false as const, error: "contact" };

  const created = await prisma.contactInquiry.create({
    data: { name, email, phone, message },
  });
  await notifyStaff({
    title: `New inquiry from ${name}`,
    body: message.slice(0, 200),
    category: "CONTACT",
  });
  revalidateClinic();
  return { ok: true as const, id: created.id };
}

export async function listContactInquiries() {
  return prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function markInquiryRead(id: string) {
  await prisma.contactInquiry.update({
    where: { id },
    data: { readAt: new Date() },
  });
  revalidateClinic();
  return { ok: true as const };
}

export async function deleteInquiry(id: string) {
  await prisma.contactInquiry.deleteMany({ where: { id } });
  revalidateClinic();
  return { ok: true as const };
}
