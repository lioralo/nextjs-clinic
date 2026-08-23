import Link from "next/link";

import {
  createFolderAction,
  createResourceAction,
  deleteFolderAction,
  deleteResourceAction,
  updateResourceAction,
} from "@/app/[locale]/(clinic)/resources/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { t } from "@/lib/copy";
import { listFolders, listResources } from "@/lib/resource-service";

function FlagChecks({
  locale,
  defaults,
}: {
  locale: "en" | "he";
  defaults?: {
    isPublic?: boolean;
    allowPatientView?: boolean;
    allowPatientDownload?: boolean;
    notifyOnAssign?: boolean;
  };
}) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <label className="flex items-center gap-1">
        <input type="checkbox" name="isPublic" value="1" defaultChecked={defaults?.isPublic} />
        {t(locale, "Public", "ציבורי")}
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          name="allowPatientView"
          value="1"
          defaultChecked={defaults?.allowPatientView !== false}
        />
        {t(locale, "Allow view", "אפשר צפייה")}
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          name="allowPatientDownload"
          value="1"
          defaultChecked={defaults?.allowPatientDownload !== false}
        />
        {t(locale, "Allow download", "אפשר הורדה")}
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          name="notifyOnAssign"
          value="1"
          defaultChecked={defaults?.notifyOnAssign !== false}
        />
        {t(locale, "Notify on assign", "הודע בשיוך")}
      </label>
    </div>
  );
}

export default async function ResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he" }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const folderId = query.folder || null;
  const [folders, resources] = await Promise.all([
    listFolders(),
    listResources(folderId),
  ]);
  const childFolders = folders.filter((folder) =>
    folderId ? folder.parentId === folderId : !folder.parentId
  );
  const current = folderId
    ? folders.find((folder) => folder.id === folderId)
    : null;
  const create = createResourceAction.bind(null, locale);
  const createFolder = createFolderAction.bind(null, locale);

  return (
    <div className="w-full min-w-0" data-testid="resources-page">
      <h1 className="mb-1 text-2xl font-semibold">
        {t(locale, "Resource center", "מרכז משאבים")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Browse folders like a path tree. Patients only see files visible to them.",
          "עיינו בתיקיות כמו עץ נתיבים. מטופלים רואים רק קבצים שגלויים להם."
        )}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/${locale}/resources`} className="hover:underline">
          {t(locale, "Root", "שורש")}
        </Link>
        {current ? (
          <>
            <span>/</span>
            <span className="font-medium">{current.name}</span>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="mb-2 text-xs font-semibold text-[var(--color-foreground)]/55">
            {t(locale, "Folders", "תיקיות")}
          </div>
          <ul className="mb-3 flex flex-col gap-1" data-testid="resource-folder-tree">
            <li>
              <Link
                href={`/${locale}/resources`}
                className={`block rounded-xl px-3 py-2 ${
                  !folderId ? "bg-[var(--color-primary-container)]" : "hover:bg-[var(--nav-hover-bg)]"
                }`}
              >
                {t(locale, "Root", "שורש")}
              </Link>
            </li>
            {folders.map((folder) => (
              <li key={folder.id} style={{ paddingInlineStart: folder.parentId ? "1rem" : 0 }}>
                <Link
                  href={`/${locale}/resources?folder=${folder.id}`}
                  className={`block rounded-xl px-3 py-2 ${
                    folderId === folder.id
                      ? "bg-[var(--color-primary-container)]"
                      : "hover:bg-[var(--nav-hover-bg)]"
                  }`}
                >
                  {folder.name}
                </Link>
              </li>
            ))}
          </ul>
          <form action={createFolder} className="flex flex-col gap-2">
            <input type="hidden" name="parentId" value={folderId ?? ""} />
            <input
              name="name"
              required
              data-testid="folder-name"
              placeholder={t(locale, "New folder", "תיקייה חדשה")}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
            <button
              type="submit"
              data-testid="create-folder"
              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              {t(locale, "Add folder", "הוסף תיקייה")}
            </button>
          </form>
        </aside>

        <div>
          {childFolders.length > 0 ? (
            <ul className="mb-4 grid gap-2 sm:grid-cols-2">
              {childFolders.map((folder) => (
                <li key={folder.id}>
                  <Link
                    href={`/${locale}/resources?folder=${folder.id}`}
                    className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-sm text-[var(--color-foreground)]/60">
                      {folder._count.resources} {t(locale, "files", "קבצים")}
                    </div>
                  </Link>
                  <div className="mt-1">
                    <ConfirmActionDialog
                      locale={locale}
                      title={t(locale, "Delete folder?", "למחוק תיקייה?")}
                      description={t(
                        locale,
                        "Files move back to root.",
                        "הקבצים יחזרו לשורש."
                      )}
                      confirmLabel={t(locale, "Delete", "מחיקה")}
                      triggerLabel={t(locale, "Delete folder", "מחק תיקייה")}
                      danger
                      action={deleteFolderAction.bind(null, locale, folder.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <form
            action={create}
            className="mb-4 flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <input type="hidden" name="folderId" value={folderId ?? ""} />
            <input
              name="title"
              required
              data-testid="resource-title"
              placeholder={t(locale, "Title", "כותרת")}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
            <input
              name="url"
              required
              data-testid="resource-url"
              placeholder="https://"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
            <textarea
              name="description"
              placeholder={t(locale, "Description", "תיאור")}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
            <FlagChecks locale={locale} />
            <button
              type="submit"
              data-testid="create-resource"
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
            >
              {t(locale, "Add resource", "הוסף משאב")}
            </button>
          </form>

          <ul className="flex flex-col gap-3">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <form
                  action={updateResourceAction.bind(null, locale, resource.id)}
                  className="flex flex-col gap-2"
                >
                  <input
                    name="title"
                    defaultValue={resource.title}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  />
                  <input
                    name="url"
                    defaultValue={resource.url}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  />
                  <textarea
                    name="description"
                    defaultValue={resource.description ?? ""}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  />
                  <label className="flex flex-col gap-1 text-sm">
                    {t(locale, "Folder", "תיקייה")}
                    <select
                      name="folderId"
                      defaultValue={resource.folderId ?? ""}
                      className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                    >
                      <option value="">{t(locale, "Root", "שורש")}</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <FlagChecks
                    locale={locale}
                    defaults={{
                      isPublic: resource.isPublic,
                      allowPatientView: resource.allowPatientView,
                      allowPatientDownload: resource.allowPatientDownload,
                      notifyOnAssign: resource.notifyOnAssign,
                    }}
                  />
                  <button
                    type="submit"
                    className="w-fit rounded-xl border border-[var(--color-border)] px-4 py-2"
                  >
                    {t(locale, "Save", "שמור")}
                  </button>
                </form>
                <ConfirmActionDialog
                  locale={locale}
                  title={t(locale, "Delete resource?", "למחוק משאב?")}
                  confirmLabel={t(locale, "Delete", "מחיקה")}
                  triggerLabel={t(locale, "Delete", "מחיקה")}
                  danger
                  action={deleteResourceAction.bind(null, locale, resource.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
