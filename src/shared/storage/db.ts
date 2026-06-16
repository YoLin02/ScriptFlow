/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'VisualTextFlowDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyValueStore';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error || new Error('Failed to open database'));
    };
  });
}

/**
 * Save value to IndexedDB with a fallback to localStorage under quota protection.
 */
export async function dbSet(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to put value'));
    });
  } catch (error) {
    console.warn('IndexedDB write failed, falling back to localStorage safely', error);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (localError) {
      console.error('localStorage quota exceeded', localError);
      // Gracefully fail instead of crashing the whole thread/React app
    }
  }
}

/**
 * Retrieve value from IndexedDB, migrating and falling back from localStorage if necessary.
 */
export async function dbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const value = await new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error || new Error('Failed to get value'));
    });

    if (value !== null) {
      return value;
    }
  } catch (error) {
    console.warn('IndexedDB read failed, falling back to localStorage', error);
  }

  // Fallback to localStorage if not found in db or db failed
  try {
    const localVal = localStorage.getItem(key);
    if (localVal) {
      const parsed = JSON.parse(localVal) as T;
      // Try to migrate to IndexedDB in background
      dbSet(key, parsed).then(() => {
        try {
          localStorage.removeItem(key); // clear to free space
        } catch (e) {
          // ignore
        }
      }).catch(() => {});
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse fallback localStorage value', e);
  }

  return null;
}

/**
 * Remove value from database and localStorage.
 */
export async function dbRemove(key: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to delete value'));
    });
  } catch (error) {
    console.warn('IndexedDB delete failed', error);
  }

  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}
