import { createGroupAction } from "@/app/[locale]/(clinic)/groups/actions";
import { t } from "@/lib/copy";
import { listGroups } from "@/lib/group-service";

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const groups = await listGroups();
  const create = createGroupAction.bind(null, locale);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Groups", "קבוצות")}
      </h1>
      <form
        action={create}
        className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2"
      >
        <input
          name="name"
          required
          data-testid="group-name"
          placeholder={t(locale, "Group name", "שם הקבוצה")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <textarea
          name="description"
          placeholder={t(locale, "Description", "תיאור")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <button
          type="submit"
          data-testid="create-group"
          className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
        >
          {t(locale, "Create group", "צור קבוצה")}
        </button>
      </form>
      <ul className="flex flex-col gap-2">
        {groups.map((group) => (
          <li key={group.id}>
            <a
              href={`/${locale}/groups/${group.id}`}
              className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <div className="font-medium">{group.name}</div>
              <div className="text-sm text-[var(--color-foreground)]/70">
                {group._count.members} {t(locale, "members", "חברים")}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
