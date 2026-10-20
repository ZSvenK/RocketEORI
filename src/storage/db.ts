import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CheckItem, ReferenceEntry, ReferenceMetadata } from '../types';

interface WarennummerDB extends DBSchema {
  reference_metadata: {
    key: string;
    value: ReferenceMetadata;
  };
  reference_entries: {
    key: string; // referenceId
    value: {
      referenceId: string;
      entries: ReferenceEntry[];
    };
  };
  check_items: {
    key: string;
    value: CheckItem;
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'warennummern_checker_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WarennummerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<WarennummerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WarennummerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('reference_metadata')) {
          db.createObjectStore('reference_metadata', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reference_entries')) {
          db.createObjectStore('reference_entries', { keyPath: 'referenceId' });
        }
        if (!db.objectStoreNames.contains('check_items')) {
          db.createObjectStore('check_items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      }
    });
  }
  return dbPromise;
}

export async function saveReferenceToDb(
  metadata: ReferenceMetadata,
  entries: ReferenceEntry[]
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['reference_metadata', 'reference_entries'], 'readwrite');
  await tx.objectStore('reference_metadata').put(metadata);
  await tx.objectStore('reference_entries').put({
    referenceId: metadata.id,
    entries
  });
  await tx.done;
}

export async function getAllReferencesFromDb(): Promise<ReferenceMetadata[]> {
  const db = await getDb();
  return db.getAll('reference_metadata');
}

export async function getReferenceEntriesFromDb(referenceId: string): Promise<ReferenceEntry[]> {
  const db = await getDb();
  const record = await db.get('reference_entries', referenceId);
  return record ? record.entries : [];
}

export async function deleteReferenceFromDb(referenceId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['reference_metadata', 'reference_entries'], 'readwrite');
  await tx.objectStore('reference_metadata').delete(referenceId);
  await tx.objectStore('reference_entries').delete(referenceId);
  await tx.done;
}

export async function saveCheckItemsToDb(items: CheckItem[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('check_items', 'readwrite');
  await tx.objectStore('check_items').clear();
  for (const item of items) {
    await tx.objectStore('check_items').put(item);
  }
  await tx.done;
}

export async function getCheckItemsFromDb(): Promise<CheckItem[]> {
  const db = await getDb();
  return db.getAll('check_items');
}

export async function clearAllCheckItemsFromDb(): Promise<void> {
  const db = await getDb();
  await db.clear('check_items');
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get('settings', key);
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  await db.put('settings', value, key);
}

export async function clearEntireDatabase(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['reference_metadata', 'reference_entries', 'check_items', 'settings'], 'readwrite');
  await tx.objectStore('reference_metadata').clear();
  await tx.objectStore('reference_entries').clear();
  await tx.objectStore('check_items').clear();
  await tx.objectStore('settings').clear();
  await tx.done;
}
