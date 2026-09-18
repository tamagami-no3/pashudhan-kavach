'use client';

const DB_NAME = 'pashudhan_offline_db';
const STORE_NAME = 'offline_reports';
const DB_VERSION = 1;

export interface OfflineReportItem {
  id?: number;
  tag_uid: string;
  symptoms: string[];
  voice_notes?: string;
  image_base64?: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  queued_at: string;
  synced?: boolean;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineReport(report: Omit<OfflineReportItem, 'id' | 'queued_at'>): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item: OfflineReportItem = {
        ...report,
        queued_at: new Date().toISOString(),
        synced: false,
      };
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to queue report in IndexedDB:', err);
    throw err;
  }
}

export async function getPendingReports(): Promise<OfflineReportItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removePendingReport(id: number): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to remove pending report:', err);
  }
}

export async function syncQueuedReportsToServer(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const reports = await getPendingReports();
  if (reports.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const report of reports) {
    try {
      const res = await fetch('/api/symptoms/triage-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag_uid: report.tag_uid,
          symptoms: report.symptoms,
          voice_notes: report.voice_notes,
          image_base64: report.image_base64,
          language: report.language || 'mr',
          latitude: report.latitude,
          longitude: report.longitude,
        }),
      });

      if (res.ok && report.id !== undefined) {
        await removePendingReport(report.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

// Auto-sync listener on reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('📡 Network online detected — syncing queued offline reports...');
    syncQueuedReportsToServer().then((result) => {
      if (result.synced > 0) {
        console.log(`✅ Synced ${result.synced} offline reports to server.`);
      }
    });
  });
}

