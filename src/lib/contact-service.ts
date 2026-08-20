import { notifyStaff } from "./messaging-service";
import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";

export async function submitContactInquiry(input: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}) {
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
