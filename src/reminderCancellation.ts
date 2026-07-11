export type CancelNotification = (identifier: string) => Promise<void>;

export type ReminderCancellationResult = {
  requestedIds: string[];
  canceledIds: string[];
};

export type ReminderCancellationFailure = {
  identifier: string;
  reason: unknown;
};

export class ReminderCancellationError extends Error {
  readonly requestedIds: string[];
  readonly canceledIds: string[];
  readonly failures: ReminderCancellationFailure[];

  constructor(result: ReminderCancellationResult, failures: ReminderCancellationFailure[]) {
    super(`Could not cancel ${failures.length} of ${result.requestedIds.length} scheduled reminders.`);
    this.name = "ReminderCancellationError";
    this.requestedIds = result.requestedIds;
    this.canceledIds = result.canceledIds;
    this.failures = failures;
  }

  get failedIds() {
    return this.failures.map((failure) => failure.identifier);
  }
}

export async function cancelNativeNotificationIds(
  identifiers: string[],
  cancelNotification: CancelNotification,
): Promise<ReminderCancellationResult> {
  const requestedIds = [...new Set(identifiers.filter((identifier) => Boolean(identifier)))];
  const outcomes = await Promise.all(requestedIds.map(async (identifier) => {
    try {
      await cancelNotification(identifier);
      return { identifier, canceled: true as const };
    } catch (reason) {
      return { identifier, canceled: false as const, reason };
    }
  }));
  const canceledIds = outcomes.filter((outcome) => outcome.canceled).map((outcome) => outcome.identifier);
  const failures = outcomes
    .filter((outcome): outcome is Extract<(typeof outcomes)[number], { canceled: false }> => !outcome.canceled)
    .map((outcome) => ({ identifier: outcome.identifier, reason: outcome.reason }));
  const result = { requestedIds, canceledIds };
  if (failures.length) throw new ReminderCancellationError(result, failures);
  return result;
}
