
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DBSchema, IDBPDatabase, openDB} from 'idb';
import {GalleryImageMetadata, HistoryResult} from './Types';
import {firestoreDb, storage, auth} from './firebase';
import {doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, where} from 'firebase/firestore';
import {ref, uploadBytes, getDownloadURL, deleteObject} from 'firebase/storage';

const DB_NAME = 'ImageAppDB';
const DB_VERSION = 4;
const GALLERY_STORE = 'gallery';
const GALLERY_METADATA_STORE = 'gallery_metadata';
const HISTORY_IMAGES_STORE = 'history_images';
const HISTORY_RESULTS_STORE = 'history_results';

interface ImageAppDB extends DBSchema {
  [GALLERY_STORE]: {
    key: number;
    value: {
      projectId: number;
      image: Blob;
      originalImage?: Blob;
    };
    indexes: {'by-project': number};
  };
  [GALLERY_METADATA_STORE]: {
    key: number;
    value: GalleryImageMetadata;
    indexes: {'by-project': number};
  };
  [HISTORY_IMAGES_STORE]: {
    key: number;
    value: Blob;
  };
  [HISTORY_RESULTS_STORE]: {
    key: number;
    value: HistoryResult;
  };
}

let dbPromise: Promise<IDBPDatabase<ImageAppDB>>;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ImageAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(GALLERY_STORE);
          db.createObjectStore(HISTORY_IMAGES_STORE);
          db.createObjectStore(HISTORY_RESULTS_STORE);
        }
        if (oldVersion < 2) {
          db.createObjectStore(GALLERY_METADATA_STORE);
        }
        if (oldVersion < 3) {
          db.deleteObjectStore(GALLERY_STORE);
          const galleryStore = db.createObjectStore(GALLERY_STORE);
          galleryStore.createIndex('by-project', 'projectId');

          db.deleteObjectStore(GALLERY_METADATA_STORE);
          const galleryMetadataStore = db.createObjectStore(
            GALLERY_METADATA_STORE,
          );
          galleryMetadataStore.createIndex('by-project', 'projectId');
        }
      },
    });
  }
  return dbPromise;
}

// Gallery functions
export const getGalleryImage = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && uid) {
    try {
      const url = await getDownloadURL(ref(storage, `users/${uid}/gallery/${key}/image`));
      const res = await fetch(url);
      return await res.blob();
    } catch (e) {
      console.error('Firebase storage error', e);
    }
  }
  return (await (await getDb()).get(GALLERY_STORE, key))?.image;
};

export const getGalleryEntry = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && firestoreDb && uid) {
    try {
      const docSnap = await getDoc(doc(firestoreDb, `users/${uid}/${GALLERY_STORE}`, String(key)));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const url = await getDownloadURL(ref(storage, `users/${uid}/gallery/${key}/image`));
        const res = await fetch(url);
        const image = await res.blob();
        let originalImage;
        try {
          const origUrl = await getDownloadURL(ref(storage, `users/${uid}/gallery/${key}/originalImage`));
          const origRes = await fetch(origUrl);
          originalImage = await origRes.blob();
        } catch (e) {}
        return { image, projectId: data.projectId, originalImage };
      }
    } catch (e) {
      console.error('Firebase getGalleryEntry error', e);
    }
  }
  return (await getDb()).get(GALLERY_STORE, key);
};

export const getAllGalleryImagesForProject = async (projectId: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && firestoreDb && uid) {
    try {
      const q = query(collection(firestoreDb, `users/${uid}/${GALLERY_STORE}`), where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      const results = [];
      for (const docSnap of querySnapshot.docs) {
        const key = Number(docSnap.id);
        const data = docSnap.data();
        const url = await getDownloadURL(ref(storage, `users/${uid}/gallery/${key}/image`));
        const res = await fetch(url);
        const image = await res.blob();
        results.push({ key, image, projectId: data.projectId });
      }
      return results;
    } catch (e) {
      console.error('Firebase getAllGalleryImagesForProject error', e);
    }
  }
  const db = await getDb();
  const tx = db.transaction(GALLERY_STORE, 'readonly');
  const index = tx.store.index('by-project');
  const images = await index.getAll(projectId);
  const keys = await index.getAllKeys(projectId);
  await tx.done;
  return images.map((img, i) => ({key: keys[i] as number, ...img}));
};

export const addGalleryImage = async (
  key: number,
  image: Blob,
  projectId: number,
  originalImage?: Blob,
) => {
  const uid = auth?.currentUser?.uid;
  if (storage && firestoreDb && uid) {
    try {
      await setDoc(doc(firestoreDb, `users/${uid}/${GALLERY_STORE}`, String(key)), { projectId });
      await uploadBytes(ref(storage, `users/${uid}/gallery/${key}/image`), image);
      if (originalImage) {
        await uploadBytes(ref(storage, `users/${uid}/gallery/${key}/originalImage`), originalImage);
      }
    } catch (e) {
      console.error('Firebase addGalleryImage error', e);
    }
  }
  return (await getDb()).put(GALLERY_STORE, {image, projectId, originalImage}, key);
};

export const deleteGalleryImage = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && firestoreDb && uid) {
    try {
      await deleteDoc(doc(firestoreDb, `users/${uid}/${GALLERY_STORE}`, String(key)));
      await deleteObject(ref(storage, `users/${uid}/gallery/${key}/image`));
      try {
        await deleteObject(ref(storage, `users/${uid}/gallery/${key}/originalImage`));
      } catch (e) {}
    } catch (e) {
      console.error('Firebase deleteGalleryImage error', e);
    }
  }
  return (await getDb()).delete(GALLERY_STORE, key);
};

export const clearGalleryForProject = async (projectId: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && firestoreDb && uid) {
    try {
      const q = query(collection(firestoreDb, `users/${uid}/${GALLERY_STORE}`), where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        const key = docSnap.id;
        await deleteDoc(doc(firestoreDb, `users/${uid}/${GALLERY_STORE}`, key));
        await deleteObject(ref(storage, `users/${uid}/gallery/${key}/image`));
        try {
          await deleteObject(ref(storage, `users/${uid}/gallery/${key}/originalImage`));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Firebase clearGalleryForProject error', e);
    }
  }
  const db = await getDb();
  const tx = db.transaction(GALLERY_STORE, 'readwrite');
  const index = tx.store.index('by-project');
  let cursor = await index.openCursor(projectId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

// Gallery metadata functions
export const getGalleryMetadata = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      const docSnap = await getDoc(doc(firestoreDb, `users/${uid}/${GALLERY_METADATA_STORE}`, String(key)));
      if (docSnap.exists()) return docSnap.data() as GalleryImageMetadata;
    } catch (e) {
      console.error('Firebase getGalleryMetadata error', e);
    }
  }
  return (await getDb()).get(GALLERY_METADATA_STORE, key);
};

export const getAllGalleryMetadataForProject = async (projectId: number) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      const q = query(collection(firestoreDb, `users/${uid}/${GALLERY_METADATA_STORE}`), where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as GalleryImageMetadata);
    } catch (e) {
      console.error('Firebase getAllGalleryMetadataForProject error', e);
    }
  }
  const db = await getDb();
  const tx = db.transaction(GALLERY_METADATA_STORE, 'readonly');
  const index = tx.store.index('by-project');
  const metadata = await index.getAll(projectId);
  await tx.done;
  return metadata;
};

export const addGalleryMetadata = async (
  key: number,
  metadata: GalleryImageMetadata,
) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      await setDoc(doc(firestoreDb, `users/${uid}/${GALLERY_METADATA_STORE}`, String(key)), metadata);
    } catch (e) {
      console.error('Firebase addGalleryMetadata error', e);
    }
  }
  return (await getDb()).put(GALLERY_METADATA_STORE, metadata, key);
};

export const deleteGalleryMetadata = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      await deleteDoc(doc(firestoreDb, `users/${uid}/${GALLERY_METADATA_STORE}`, String(key)));
    } catch (e) {
      console.error('Firebase deleteGalleryMetadata error', e);
    }
  }
  return (await getDb()).delete(GALLERY_METADATA_STORE, key);
};

export const clearGalleryMetadataForProject = async (projectId: number) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      const q = query(collection(firestoreDb, `users/${uid}/${GALLERY_METADATA_STORE}`), where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(firestoreDb, `users/${uid}/${GALLERY_METADATA_STORE}`, docSnap.id));
      }
    } catch (e) {
      console.error('Firebase clearGalleryMetadataForProject error', e);
    }
  }
  const db = await getDb();
  const tx = db.transaction(GALLERY_METADATA_STORE, 'readwrite');
  const index = tx.store.index('by-project');
  let cursor = await index.openCursor(projectId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

// History image functions
export const addHistoryImage = async (key: number, image: Blob) => {
  const uid = auth?.currentUser?.uid;
  if (storage && uid) {
    try {
      await uploadBytes(ref(storage, `users/${uid}/history_images/${key}`), image);
    } catch (e) {
      console.error('Firebase addHistoryImage error', e);
    }
  }
  return (await getDb()).put(HISTORY_IMAGES_STORE, image, key);
};

export const getHistoryImage = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && uid) {
    try {
      const url = await getDownloadURL(ref(storage, `users/${uid}/history_images/${key}`));
      const res = await fetch(url);
      return await res.blob();
    } catch (e) {
      console.error('Firebase getHistoryImage error', e);
    }
  }
  return (await getDb()).get(HISTORY_IMAGES_STORE, key);
};

export const deleteHistoryImage = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (storage && uid) {
    try {
      await deleteObject(ref(storage, `users/${uid}/history_images/${key}`));
    } catch (e) {
      console.error('Firebase deleteHistoryImage error', e);
    }
  }
  return (await getDb()).delete(HISTORY_IMAGES_STORE, key);
};

// History result functions
export const addHistoryResult = async (key: number, result: HistoryResult) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      await setDoc(doc(firestoreDb, `users/${uid}/${HISTORY_RESULTS_STORE}`, String(key)), { result });
    } catch (e) {
      console.error('Firebase addHistoryResult error', e);
    }
  }
  return (await getDb()).put(HISTORY_RESULTS_STORE, result, key);
};

export const getHistoryResult = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      const docSnap = await getDoc(doc(firestoreDb, `users/${uid}/${HISTORY_RESULTS_STORE}`, String(key)));
      if (docSnap.exists()) return docSnap.data().result as HistoryResult;
    } catch (e) {
      console.error('Firebase getHistoryResult error', e);
    }
  }
  return (await getDb()).get(HISTORY_RESULTS_STORE, key);
};

export const getAllHistoryResults = async () => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      const querySnapshot = await getDocs(collection(firestoreDb, `users/${uid}/${HISTORY_RESULTS_STORE}`));
      return querySnapshot.docs.map(doc => doc.data().result as HistoryResult);
    } catch (e) {
      console.error('Firebase getAllHistoryResults error', e);
    }
  }
  return (await getDb()).getAll(HISTORY_RESULTS_STORE);
};

export const deleteHistoryResult = async (key: number) => {
  const uid = auth?.currentUser?.uid;
  if (firestoreDb && uid) {
    try {
      await deleteDoc(doc(firestoreDb, `users/${uid}/${HISTORY_RESULTS_STORE}`, String(key)));
    } catch (e) {
      console.error('Firebase deleteHistoryResult error', e);
    }
  }
  return (await getDb()).delete(HISTORY_RESULTS_STORE, key);
};
