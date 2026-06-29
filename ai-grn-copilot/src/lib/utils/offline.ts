import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GRNOfflineDB extends DBSchema {
  drafts: {
    key: string;
    value: {
      id: string;
      data: unknown;
      timestamp: number;
      synced: boolean;
    };
  };
  invoices: {
    key: string;
    value: {
      id: string;
      file_name: string;
      base64: string;
      mime_type: string;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<GRNOfflineDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<GRNOfflineDB>> {
  if (db) return db;

  db = await openDB<GRNOfflineDB>('grn-copilot-offline', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('drafts')) {
        database.createObjectStore('drafts', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('invoices')) {
        database.createObjectStore('invoices', { keyPath: 'id' });
      }
    },
  });

  return db;
}

export async function saveDraftOffline(id: string, data: unknown): Promise<void> {
  try {
    const database = await getDB();
    await database.put('drafts', {
      id,
      data,
      timestamp: Date.now(),
      synced: false,
    });
  } catch (err) {
    console.warn('Offline save failed:', err);
  }
}

export async function getDraftOffline(id: string): Promise<unknown | null> {
  try {
    const database = await getDB();
    const draft = await database.get('drafts', id);
    return draft?.data || null;
  } catch {
    return null;
  }
}

export async function getAllDraftsOffline(): Promise<unknown[]> {
  try {
    const database = await getDB();
    const drafts = await database.getAll('drafts');
    return drafts.filter((d) => !d.synced);
  } catch {
    return [];
  }
}

export async function markDraftSynced(id: string): Promise<void> {
  try {
    const database = await getDB();
    const draft = await database.get('drafts', id);
    if (draft) {
      await database.put('drafts', { ...draft, synced: true });
    }
  } catch {
    // silent
  }
}

export async function saveInvoiceOffline(
  id: string,
  fileName: string,
  base64: string,
  mimeType: string
): Promise<void> {
  try {
    const database = await getDB();
    await database.put('invoices', {
      id,
      file_name: fileName,
      base64,
      mime_type: mimeType,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('Invoice offline save failed:', err);
  }
}
