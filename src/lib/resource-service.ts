import { createNotification } from "./messaging-service";
import { sendMail } from "./mail";
import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";

export async function listResources() {
  return prisma.resource.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getResource(id: string) {
  return prisma.resource.findUnique({ where: { id } });
}

export async function createResource(input: {
  title: string;
  description?: string;
  url: string;
  isPublic?: boolean;
  allowPatientView?: boolean;
  allowPatientDownload?: boolean;
  notifyOnAssign?: boolean;
}) {
  const title = input.title.trim();
  const url = input.url.trim();
  if (!title || !url) return { ok: false as const, error: "invalid" };
  const resource = await prisma.resource.create({
    data: {
      title,
      description: input.description?.trim() || null,
      url,
      isPublic: Boolean(input.isPublic),
      allowPatientView: input.allowPatientView !== false,
      allowPatientDownload: input.allowPatientDownload !== false,
      notifyOnAssign: input.notifyOnAssign !== false,
    },
  });
  return { ok: true as const, id: resource.id };
}

export async function updateResource(
  id: string,
  input: {
    title: string;
    description?: string;
    url: string;
    isPublic?: boolean;
    allowPatientView?: boolean;
    allowPatientDownload?: boolean;
    notifyOnAssign?: boolean;
  }
) {
  const title = input.title.trim();
  const url = input.url.trim();
  if (!title || !url) return { ok: false as const, error: "invalid" };
  await prisma.resource.update({
    where: { id },
    data: {
      title,
      description: input.description?.trim() || null,
      url,
      isPublic: Boolean(input.isPublic),
      allowPatientView: input.allowPatientView !== false,
      allowPatientDownload: input.allowPatientDownload !== false,
      notifyOnAssign: input.notifyOnAssign !== false,
    },
  });
  return { ok: true as const };
}

export async function deleteResource(id: string) {
  await prisma.resource.delete({ where: { id } });
  return { ok: true as const };
}

export async function listPatientResources(patientId: string) {
  return prisma.patientResource.findMany({
    where: { patientId },
    include: { resource: true },
    orderBy: { assignedAt: "desc" },
  });
}

export async function assignResource(patientId: string, resourceId: string) {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return { ok: false as const, error: "invalid" };

  await prisma.patientResource.upsert({
    where: { patientId_resourceId: { patientId, resourceId } },
    update: {},
    create: { patientId, resourceId },
  });

  if (resource.notifyOnAssign) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { portalUser: true },
    });
    if (patient?.portalUser) {
      await createNotification({
        recipientUserId: patient.portalUser.id,
        title: "New resource",
        body: resource.title,
        category: "RESOURCE",
      });
      const email = patient.portalUser.email || patient.email;
      if (email && patient.reminderEmailEnabled) {
        await sendMail({
          to: email,
          subject: `Resource: ${resource.title}`,
          text: `A new resource was assigned: ${resource.title}\n${resource.url}`,
        });
      }
    }
  }

  revalidateClinic(patientId);
  return { ok: true as const };
}

export async function unassignResource(patientId: string, resourceId: string) {
  await prisma.patientResource.deleteMany({ where: { patientId, resourceId } });
  revalidateClinic(patientId);
  return { ok: true as const };
}

export async function canAccessResource(input: {
  resourceId: string;
  action: "view" | "download";
  user?: { id: string; role?: string; patientId?: string | null } | null;
}) {
  const resource = await prisma.resource.findUnique({
    where: { id: input.resourceId },
  });
  if (!resource) return { ok: false as const, error: "missing" as const };

  const isStaff =
    input.user?.role === "ADMIN" || input.user?.role === "CLINICIAN";
  if (isStaff) return { ok: true as const, resource };

  if (input.action === "download" && !resource.allowPatientDownload) {
    return { ok: false as const, error: "forbidden" as const };
  }
  if (!resource.allowPatientView) {
    return { ok: false as const, error: "forbidden" as const };
  }
  if (resource.isPublic) return { ok: true as const, resource };

  if (input.user?.role === "PATIENT" && input.user.patientId) {
    const assigned = await prisma.patientResource.findUnique({
      where: {
        patientId_resourceId: {
          patientId: input.user.patientId,
          resourceId: resource.id,
        },
      },
    });
    if (assigned) return { ok: true as const, resource };
  }

  return { ok: false as const, error: "forbidden" as const };
}
