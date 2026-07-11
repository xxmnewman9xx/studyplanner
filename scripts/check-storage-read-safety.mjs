import assert from "node:assert/strict";
import { resolve } from "node:path";
import { build } from "esbuild";

const HARNESS_KEY = "__studyPlannerStorageReadSafetyHarness";
const APP_DATA_KEY = "app-data";
const CORRUPT_BACKUP_PREFIX = "app-data-corrupt-";

const bundle = await build({
  entryPoints: [resolve(process.cwd(), "src/storage.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  write: false,
  plugins: [
    {
      name: "storage-read-safety-mocks",
      setup(buildApi) {
        buildApi.onResolve({ filter: /^react-native$/ }, () => ({ path: "react-native", namespace: "storage-read-safety" }));
        buildApi.onResolve({ filter: /^expo-sqlite$/ }, () => ({ path: "expo-sqlite", namespace: "storage-read-safety" }));
        buildApi.onLoad({ filter: /.*/, namespace: "storage-read-safety" }, ({ path }) => {
          if (path === "react-native") {
            return { contents: 'export const Platform = { OS: "ios" };', loader: "js" };
          }
          return {
            contents: `
              export function openDatabaseAsync(name) {
                return globalThis.${HARNESS_KEY}.openDatabaseAsync(name);
              }
            `,
            loader: "js",
          };
        });
      },
    },
  ],
});

const bundledStorage = Buffer.from(bundle.outputFiles[0].text).toString("base64");
let moduleSequence = 0;

async function freshStorage(openDatabaseAsync) {
  globalThis[HARNESS_KEY] = { openDatabaseAsync };
  moduleSequence += 1;
  return import(`data:text/javascript;base64,${bundledStorage}#storage-read-safety-${moduleSequence}`);
}

function createDatabase({ read, write }) {
  return {
    async execAsync() {},
    async getFirstAsync() {
      return read();
    },
    async runAsync(_sql, key, value) {
      return write(key, value);
    },
  };
}

function preservedPayload() {
  return {
    prefs: {
      name: "Preserved Student",
      firstName: "Preserved",
      onboardingComplete: true,
      osLive: true,
    },
    classes: [{ id: "class-preserved", code: "CS 500", name: "Distributed Systems" }],
    tasks: [{ id: "task-preserved", classId: "class-preserved", title: "Consensus write-up", dueDate: "2030-10-20" }],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
    feedbackEvents: [],
  };
}

async function checkTransientReadPreservesAndRecovers() {
  const transientError = new Error("database is locked");
  const writes = [];
  const raw = JSON.stringify(preservedPayload());
  let openCount = 0;
  let readCount = 0;
  const storage = await freshStorage(async () => {
    openCount += 1;
    return createDatabase({
      read() {
        readCount += 1;
        if (readCount === 1) throw transientError;
        return { value: raw };
      },
      write(key, value) {
        writes.push({ key, value });
      },
    });
  });

  await assert.rejects(storage.loadData(), (error) => error === transientError);
  assert.deepEqual(writes, [], "a transient SELECT failure must not write defaults or a corruption backup");

  const recovered = await storage.loadData();
  assert.equal(openCount, 2, "the failed SQLite connection must be discarded so a later load can reopen it");
  assert.equal(recovered.classes[0]?.id, "class-preserved");
  assert.equal(recovered.tasks[0]?.id, "task-preserved");
  assert.deepEqual(writes, [], "successful retry must hydrate the original planner without rewriting it");
}

async function checkTransientOpenPreservesAndRecovers() {
  const transientError = new Error("unable to open database file");
  const raw = JSON.stringify(preservedPayload());
  const writes = [];
  let openCount = 0;
  const storage = await freshStorage(async () => {
    openCount += 1;
    if (openCount === 1) throw transientError;
    return createDatabase({
      read: () => ({ value: raw }),
      write(key, value) {
        writes.push({ key, value });
      },
    });
  });

  await assert.rejects(storage.loadData(), (error) => error === transientError);
  assert.deepEqual(writes, [], "an open failure must not create a replacement planner");

  const recovered = await storage.loadData();
  assert.equal(openCount, 2, "a rejected open promise must not poison later load attempts");
  assert.equal(recovered.prefs.firstName, "Preserved");
  assert.deepEqual(writes, []);
}

async function checkMissingPayloadBootstrapsOnce() {
  const writes = [];
  const storage = await freshStorage(async () => createDatabase({
    read: () => null,
    write(key, value) {
      writes.push({ key, value });
    },
  }));

  const loaded = await storage.loadData();
  assert.equal(writes.length, 1, "a genuinely missing row should be initialized exactly once");
  assert.equal(writes[0].key, APP_DATA_KEY);
  assert.deepEqual(JSON.parse(writes[0].value), JSON.parse(JSON.stringify(loaded)));
}

async function checkAppearanceMigrationPreservesLegacyChoice() {
  const darkPayload = preservedPayload();
  darkPayload.prefs.theme = "dark";
  const darkStorage = await freshStorage(async () => createDatabase({
    read: () => ({ value: JSON.stringify(darkPayload) }),
    write() {},
  }));
  assert.equal((await darkStorage.loadData()).prefs.appearanceMode, "dark", "legacy dark users must remain dark after migration");

  const explicitSystemPayload = preservedPayload();
  explicitSystemPayload.prefs.theme = "dark";
  explicitSystemPayload.prefs.appearanceMode = "system";
  const systemStorage = await freshStorage(async () => createDatabase({
    read: () => ({ value: JSON.stringify(explicitSystemPayload) }),
    write() {},
  }));
  assert.equal((await systemStorage.loadData()).prefs.appearanceMode, "system", "an explicit System preference must win over the legacy theme");

  const lightPayload = preservedPayload();
  lightPayload.prefs.theme = "light";
  const lightStorage = await freshStorage(async () => createDatabase({
    read: () => ({ value: JSON.stringify(lightPayload) }),
    write() {},
  }));
  assert.equal((await lightStorage.loadData()).prefs.appearanceMode, "system", "legacy light data should adopt the new System default");
}

async function checkCorruptPayloadBacksUpBeforeReset() {
  for (const corruptRaw of ["", "null", "{not-json"]) {
    const writes = [];
    const storage = await freshStorage(async () => createDatabase({
      read: () => ({ value: corruptRaw }),
      write(key, value) {
        writes.push({ key, value });
      },
    }));

    await storage.loadData();
    assert.equal(writes.length, 2, `corrupt payload ${JSON.stringify(corruptRaw)} should be backed up and reset`);
    assert.ok(writes[0].key.startsWith(CORRUPT_BACKUP_PREFIX));
    assert.equal(writes[0].value, corruptRaw);
    assert.equal(writes[1].key, APP_DATA_KEY);
  }
}

async function checkCorruptBackupFailureLeavesActiveKeyUntouched() {
  const transientError = new Error("disk I/O error");
  const corruptRaw = "{not-json";
  const attemptedWrites = [];
  let openCount = 0;
  let failBackup = true;
  const storage = await freshStorage(async () => {
    openCount += 1;
    return createDatabase({
      read: () => ({ value: corruptRaw }),
      write(key, value) {
        attemptedWrites.push({ key, value });
        if (failBackup) {
          failBackup = false;
          throw transientError;
        }
      },
    });
  });

  await assert.rejects(storage.loadData(), (error) => error === transientError);
  assert.equal(attemptedWrites.length, 1);
  assert.ok(attemptedWrites[0].key.startsWith(CORRUPT_BACKUP_PREFIX));
  assert.equal(
    attemptedWrites.some(({ key }) => key === APP_DATA_KEY),
    false,
    "when the corrupt backup cannot be secured, the active key must not be replaced",
  );

  await storage.loadData();
  assert.equal(openCount, 2, "corrupt recovery I/O failure should also permit a clean reopen/retry");
  assert.equal(attemptedWrites.at(-1)?.key, APP_DATA_KEY);
}

try {
  await checkTransientReadPreservesAndRecovers();
  await checkTransientOpenPreservesAndRecovers();
  await checkMissingPayloadBootstrapsOnce();
  await checkAppearanceMigrationPreservesLegacyChoice();
  await checkCorruptPayloadBacksUpBeforeReset();
  await checkCorruptBackupFailureLeavesActiveKeyUntouched();
  console.log("Storage read safety checks passed.");
} finally {
  delete globalThis[HARNESS_KEY];
}
