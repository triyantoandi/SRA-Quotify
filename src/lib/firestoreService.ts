import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, getDocFromServer, getDocs, writeBatch 
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'appSettings'));
    console.log('✅ Firebase Firestore connected successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('⚠️ Firebase client is currently offline or connecting...');
    } else {
      console.log('Firebase ready status check complete:', error);
    }
    return false;
  }
}

// Execute connection test
testFirestoreConnection();

export function subscribeCollection<T extends { id: string }>(
  collectionName: string, 
  onData: (data: T[]) => void,
  initialFallback?: T[]
) {
  const colRef = collection(db, collectionName);
  
  const unsubscribe = onSnapshot(colRef, async (snapshot) => {
    try {
      if (snapshot.empty) {
        // Only seed initial users if users collection is completely empty (needed for login)
        if (collectionName === 'users' && initialFallback && initialFallback.length > 0) {
          onData(initialFallback);
          for (const item of initialFallback) {
            if (item && item.id) {
              try {
                const cleanItem = sanitizeForFirestore(item);
                await setDoc(doc(db, collectionName, String(item.id)), cleanItem, { merge: true });
              } catch (e) {
                console.warn(`Error seeding doc ${item.id} in ${collectionName}:`, e);
              }
            }
          }
        } else {
          // For all business documents (quotations, items, customers, logs), empty stays empty
          onData([]);
        }
      } else {
        const legacyDemoIds = ['QUO-202608-101', 'QUO-202608-102', 'QUO-202608-103'];
        const docsData = snapshot.docs
          .map(d => ({
            ...d.data(),
            id: d.id
          })) as T[];

        // Purge legacy demo docs if encountered
        if (collectionName === 'quotations') {
          const filtered = docsData.filter(d => {
            if (legacyDemoIds.includes(d.id)) {
              deleteDoc(doc(db, 'quotations', d.id)).catch(() => {});
              return false;
            }
            return true;
          });
          onData(filtered);
        } else {
          onData(docsData);
        }
      }
    } catch (err) {
      console.error(`Error processing snapshot for ${collectionName}:`, err);
      handleFirestoreError(err, OperationType.LIST, collectionName);
      if (collectionName === 'users' && initialFallback) {
        onData(initialFallback);
      } else {
        onData([]);
      }
    }
  }, (err) => {
    console.error(`Firestore subscribe error [${collectionName}]:`, err);
    handleFirestoreError(err, OperationType.LIST, collectionName);
    if (collectionName === 'users' && initialFallback) {
      onData(initialFallback);
    } else {
      onData([]);
    }
  });

  return unsubscribe;
}

export function subscribeDoc<T>(
  collectionName: string, 
  docId: string, 
  onData: (data: T) => void,
  initialFallback?: T
) {
  const docRef = doc(db, collectionName, docId);
  
  const unsubscribe = onSnapshot(docRef, async (snapshot) => {
    try {
      if (!snapshot.exists() && initialFallback) {
        onData(initialFallback);
        try {
          const cleanFallback = sanitizeForFirestore(initialFallback);
          await setDoc(docRef, cleanFallback, { merge: true });
        } catch (e) {
          console.warn(`Error seeding doc ${collectionName}/${docId}:`, e);
        }
      } else if (snapshot.exists()) {
        const docData = snapshot.data();
        const merged = initialFallback ? { ...initialFallback, ...docData } : (docData as T);
        onData(merged as T);
      }
    } catch (err) {
      console.error(`Error processing doc snapshot for ${collectionName}/${docId}:`, err);
      handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
      if (initialFallback) onData(initialFallback);
    }
  }, (err) => {
    console.error(`Firestore doc subscribe error [${collectionName}/${docId}]:`, err);
    handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
    if (initialFallback) onData(initialFallback);
  });

  return unsubscribe;
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

export async function saveFirestoreDoc(collectionName: string, docId: string, data: any) {
  try {
    const cleanData = sanitizeForFirestore(data);
    const docRef = doc(db, collectionName, String(docId));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error(`Error saving to Firestore [${collectionName}/${docId}]:`, err);
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    throw err;
  }
}

export async function deleteFirestoreDoc(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting from Firestore [${collectionName}/${docId}]:`, err);
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
    throw err;
  }
}

export async function clearFirestoreCollection(collectionName: string): Promise<number> {
  try {
    localStorage.setItem(`sra_cleared_${collectionName}`, 'true');
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return 0;
    
    // Batch delete
    const batch = writeBatch(db);
    snapshot.docs.forEach((docItem) => {
      batch.delete(docItem.ref);
    });
    await batch.commit();
    return snapshot.size;
  } catch (err) {
    console.error(`Error clearing Firestore collection [${collectionName}]:`, err);
    handleFirestoreError(err, OperationType.DELETE, collectionName);
    throw err;
  }
}
