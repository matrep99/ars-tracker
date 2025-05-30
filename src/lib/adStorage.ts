
export interface AdRecord {
  id: string;
  campaignName: string;
  budget: number;
  revenue: number;
  orders: number;
  products: number;
  date: string;
  roi: number;
  aov: number;
  productsPerOrder: number;
  createdAt: string;
}

const DB_NAME = 'AdPerformanceDB';
const DB_VERSION = 1;
const STORE_NAME = 'adRecords';

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('campaignName', 'campaignName', { unique: false });
      }
    };
  });
};

export const saveAdRecord = async (record: AdRecord): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onerror = () => {
      reject(new Error('Failed to save record'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const getAllAdRecords = async (): Promise<AdRecord[]> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('Failed to get records'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
};

export const deleteAdRecord = async (id: string): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      reject(new Error('Failed to delete record'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const getAdRecordById = async (id: string): Promise<AdRecord | null> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      reject(new Error('Failed to get record'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
};
