import {
  broadcastNotificationAction,
  sendStaffMessageAction,
} from "@/app/[locale]/(clinic)/messages/actions";
import { t } from "@/lib/copy";
import {
  listStaffConversations,
  listThread,
} from "@/lib/messaging-service";
import { getSessionUser } from "@/lib/session";

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he" }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const user = await getSessionUser();
  if (!user) return null;

  const conversations = await listStaffConversations(user.id);
  const activeId = query.with ?? conversations[0]?.user.id ?? "";
  const thread = activeId ? await listThread(user.id, activeId) : [];
  const send = sendStaffMessageAction.bind(null, locale, activeId);

  return (
    <div className="max-w-5xl grid gap-4 md:grid-cols-[16rem_1fr]">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h1 className="text-lg font-semibold mb-3">
          {t(locale, "Messages", "הודעות")}
        </h1>
        <ul className="flex flex-col gap-2" data-testid="message-list">
          {conversations.map((conversation) => (
            <li key={conversation.user.id}>
              <a
                href={`/${locale}/messages?with=${conversation.user.id}`}
                className={`block rounded-xl px-3 py-2 ${
                  conversation.user.id === activeId
                    ? "bg-[var(--color-primary-container)]"
                    : "hover:bg-[var(--color-primary-container)]/50"
                }`}
              >
                {conversation.user.patient
                  ? `${conversation.user.patient.firstName} ${conversation.user.patient.lastName}`
                  : conversation.user.username}
                {conversation.unread ? (
                  <span className="ms-2 text-xs">{conversation.unread}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
        <form
          action={broadcastNotificationAction.bind(null, locale)}
          className="mt-4 flex flex-col gap-2"
        >
          <input
            name="title"
            placeholder={t(locale, "Broadcast title", "כותרת שידור")}
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <textarea
            name="body"
            required
            placeholder={t(locale, "Notify all portal users", "הודעה לכל משתמשי הפורטל")}
            className="min-h-16 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
          <button
            type="submit"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2"
          >
            {t(locale, "Broadcast", "שידור")}
          </button>
        </form>
      </section>
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {activeId ? (
          <>
            <div className="flex flex-col gap-2 mb-4" data-testid="message-thread">
              {thread.length === 0 ? (
                <p className="text-[var(--color-foreground)]/70">
                  {t(locale, "No messages yet.", "אין עדיין הודעות.")}
                </p>
              ) : (
                thread.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2"
                  >
                    <div className="text-xs text-[var(--color-foreground)]/70">
                      {row.senderId === user.id
                        ? t(locale, "You", "את/ה")
                        : t(locale, "Patient", "מטופל")}
                    </div>
                    <div className="whitespace-pre-wrap">{row.body}</div>
                  </div>
                ))
              )}
            </div>
            <form action={send} className="flex flex-col gap-2">
              <textarea
                name="body"
                required
                data-testid="message-body"
                className="min-h-20 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
              <button
                type="submit"
                data-testid="send-message"
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
              >
                {t(locale, "Send", "שלח")}
              </button>
            </form>
          </>
        ) : (
          <p className="text-[var(--color-foreground)]/70">
            {t(
              locale,
              "Grant a patient portal access to start messaging.",
              "יש להעניק גישה לפורטל כדי להתחיל התכתבות."
            )}
          </p>
        )}
      </section>
    </div>
  );
}
