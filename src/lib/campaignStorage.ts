
export interface Product {
  nome: string;
  quantita: number;
}

export interface CampaignRecord {
  id: string;
  titolo: string;
  descrizione: string;
  budget: number;
  fatturato: number;
  ordini: number;
  prodotti: number;
  prodottiVenduti: Product[];
  data: string;
  roi: number;
  valoreMedioOrdine: number;
  prodottiMediPerOrdine: number;
  creatoIl: string;
}

const DB_NAME = 'CampaignTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'campaigns';

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Errore nell\'apertura del database'));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('data', 'data', { unique: false });
        store.createIndex('titolo', 'titolo', { unique: false });
      }
    };
  });
};

export const saveCampaign = async (record: CampaignRecord): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onerror = () => {
      reject(new Error('Errore nel salvataggio della campagna'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const getAllCampaigns = async (): Promise<CampaignRecord[]> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('Errore nel caricamento delle campagne'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
};

export const deleteCampaign = async (id: string): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      reject(new Error('Errore nell\'eliminazione della campagna'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const getCampaignById = async (id: string): Promise<CampaignRecord | null> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      reject(new Error('Errore nel caricamento della campagna'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
};
