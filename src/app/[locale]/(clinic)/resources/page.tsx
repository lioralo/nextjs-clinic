import {
  createResourceAction,
  deleteResourceAction,
  updateResourceAction,
} from "@/app/[locale]/(clinic)/resources/actions";
import { t } from "@/lib/copy";
import { listResources } from "@/lib/resource-service";

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
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const resources = await listResources();
  const create = createResourceAction.bind(null, locale);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Resource center", "מרכז משאבים")}
      </h1>
      <form
        action={create}
        className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2"
      >
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
          className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
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
              <FlagChecks
                locale={locale}
                defaults={{
                  isPublic: resource.isPublic,
                  allowPatientView: resource.allowPatientView,
                  allowPatientDownload: resource.allowPatientDownload,
                  notifyOnAssign: resource.notifyOnAssign,
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2"
                >
                  {t(locale, "Save", "שמור")}
                </button>
              </div>
            </form>
            <form action={deleteResourceAction.bind(null, locale, resource.id)}>
              <button type="submit" className="mt-2 text-sm hover:underline">
                {t(locale, "Delete", "מחיקה")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
