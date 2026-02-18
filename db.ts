
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
          // Recreate stores with index for project management
          db.deleteObjectStore(GALLERY_STORE);
          const galleryStore = db.createObjectStore(GALLERY_STORE);
          galleryStore.createIndex('by-project', 'projectId');

          db.deleteObjectStore(GALLERY_METADATA_STORE);
          const galleryMetadataStore = db.createObjectStore(
            GALLERY_METADATA_STORE,
          );
          galleryMetadataStore.createIndex('by-project', 'projectId');
        }
        // Version 4 adds originalImage field, no store recreation needed as objects are flexible
      },
    });
  }
  return dbPromise;
}

// Gallery functions
export const getGalleryImage = async (key: number) =>
  (await (await getDb()).get(GALLERY_STORE, key))?.image;

export const getGalleryEntry = async (key: number) =>
  (await getDb()).get(GALLERY_STORE, key);

export const getAllGalleryImagesForProject = async (projectId: number) => {
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
) => (await getDb()).put(GALLERY_STORE, {image, projectId, originalImage}, key);

export const deleteGalleryImage = async (key: number) =>
  (await getDb()).delete(GALLERY_STORE, key);
export const clearGalleryForProject = async (projectId: number) => {
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
export const getGalleryMetadata = async (key: number) =>
  (await getDb()).get(GALLERY_METADATA_STORE, key);

export const getAllGalleryMetadataForProject = async (projectId: number) => {
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
) => (await getDb()).put(GALLERY_METADATA_STORE, metadata, key);
export const deleteGalleryMetadata = async (key: number) =>
  (await getDb()).delete(GALLERY_METADATA_STORE, key);
export const clearGalleryMetadataForProject = async (projectId: number) => {
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

// History image functions (remain project-agnostic, linked by history item)
export const addHistoryImage = async (key: number, image: Blob) =>
  (await getDb()).put(HISTORY_IMAGES_STORE, image, key);
export const getHistoryImage = async (key: number) =>
  (await getDb()).get(HISTORY_IMAGES_STORE, key);
export const deleteHistoryImage = async (key: number) =>
  (await getDb()).delete(HISTORY_IMAGES_STORE, key);

// History result functions (remain project-agnostic, linked by history item)
export const addHistoryResult = async (key: number, result: HistoryResult) =>
  (await getDb()).put(HISTORY_RESULTS_STORE, result, key);
export const getHistoryResult = async (key: number) =>
  (await getDb()).get(HISTORY_RESULTS_STORE, key);
export const getAllHistoryResults = async () =>
  (await getDb()).getAll(HISTORY_RESULTS_STORE);
export const deleteHistoryResult = async (key: number) =>
  (await getDb()).delete(HISTORY_RESULTS_STORE, key);
