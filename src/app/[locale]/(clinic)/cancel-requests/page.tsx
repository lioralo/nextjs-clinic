import {
  approveCancelAction,
  rejectCancelAction,
} from "@/app/[locale]/(clinic)/cancel-requests/actions";
import { listPendingCancelRequests } from "@/lib/cancel-service";
import { t } from "@/lib/copy";

export default async function CancelRequestsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const requests = await listPendingCancelRequests();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Cancel requests", "בקשות ביטול")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Approve to cancel the meeting, or reject to keep it.",
          "אשרו כדי לבטל את הפגישה, או דחו כדי להשאיר אותה."
        )}
      </p>
      {requests.length === 0 ? (
        <p className="text-[var(--color-foreground)]/70">
          {t(locale, "No pending requests.", "אין בקשות ממתינות.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="cancel-queue">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="font-medium">
                {request.patient.firstName} {request.patient.lastName}
              </div>
              <div className="text-sm text-[var(--color-foreground)]/70">
                {request.appointment.startAt.toLocaleString(locale)}
              </div>
              <p className="mt-2 whitespace-pre-wrap">{request.reason}</p>
              <div className="mt-3 flex gap-2">
                <form action={approveCancelAction.bind(null, locale, request.id)}>
                  <button
                    type="submit"
                    data-testid="approve-cancel"
                    className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
                  >
                    {t(locale, "Approve", "אשר")}
                  </button>
                </form>
                <form action={rejectCancelAction.bind(null, locale, request.id)}>
                  <button
                    type="submit"
                    className="rounded-xl border border-[var(--color-border)] px-4 py-2"
                  >
                    {t(locale, "Reject", "דחה")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
