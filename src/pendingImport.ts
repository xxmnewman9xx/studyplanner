import { File, Paths } from "expo-file-system";
import type { ImportBatch } from "./types";

export const PENDING_IMPORT_FILE = "pending-import.json";
export const MAX_PENDING_IMPORT_BYTES = 750_000;
export const MAX_PENDING_IMPORT_CANDIDATES = 80;
export const MAX_PENDING_IMPORT_AGE_DAYS = 14;

function pendingImportFile() {
  return new File(Paths.document, PENDING_IMPORT_FILE);
}

function isImportBatch(value: unknown): value is ImportBatch {
  const batch = value as Partial<ImportBatch> | null;
  const createdAtMs = typeof batch?.createdAt === "string" ? Date.parse(batch.createdAt) : Number.NaN;
  const maxAgeMs = MAX_PENDING_IMPORT_AGE_DAYS * 24 * 60 * 60 * 1000;
  return Boolean(
    batch &&
      typeof batch.id === "string" &&
      typeof batch.sourceName === "string" &&
      typeof batch.sourceText === "string" &&
      typeof batch.createdAt === "string" &&
      Number.isFinite(createdAtMs) &&
      Date.now() - createdAtMs <= maxAgeMs &&
      batch.status === "review" &&
      Array.isArray(batch.candidates) &&
      batch.candidates.length > 0 &&
      batch.candidates.length <= MAX_PENDING_IMPORT_CANDIDATES &&
      batch.candidates.every((candidate) => {
        const item = candidate as any;
        return (
          item &&
          typeof item.id === "string" &&
          ["class", "task", "exam", "note"].includes(item.kind) &&
          typeof item.title === "string" &&
          typeof item.meta === "string" &&
          typeof item.confidence === "number" &&
          typeof item.approved === "boolean" &&
          item.payload &&
          typeof item.payload === "object"
        );
      })
  );
}

export async function loadPendingImport(): Promise<ImportBatch | null> {
  try {
    const file = pendingImportFile();
    if (!file.exists) return null;
    const raw = await file.text();
    if (raw.length > MAX_PENDING_IMPORT_BYTES) {
      await clearPendingImport();
      return null;
    }
    const parsed = JSON.parse(raw);
    if (isImportBatch(parsed)) return parsed;
    await clearPendingImport();
    return null;
  } catch {
    return null;
  }
}

export async function savePendingImport(batch: ImportBatch) {
  const file = pendingImportFile();
  const raw = JSON.stringify({ ...batch, status: "review", candidates: batch.candidates.slice(0, MAX_PENDING_IMPORT_CANDIDATES) });
  if (raw.length > MAX_PENDING_IMPORT_BYTES) return;
  if (!file.exists) file.create({ intermediates: true });
  file.write(raw);
}

export async function clearPendingImport() {
  const file = pendingImportFile();
  if (file.exists) file.delete();
}
