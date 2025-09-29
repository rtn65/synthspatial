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
import {HistoryResult} from './Types';

const DB_NAME = 'ImageAppDB';
const DB_VERSION = 1;
const GALLERY_STORE = 'gallery';
const HISTORY_IMAGES_STORE = 'history_images';
const HISTORY_RESULTS_STORE = 'history_results';

interface ImageAppDB extends DBSchema {
  [GALLERY_STORE]: {
    key: number;
    value: Blob;
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
      upgrade(db) {
        if (!db.objectStoreNames.contains(GALLERY_STORE)) {
          db.createObjectStore(GALLERY_STORE);
        }
        if (!db.objectStoreNames.contains(HISTORY_IMAGES_STORE)) {
          db.createObjectStore(HISTORY_IMAGES_STORE);
        }
        if (!db.objectStoreNames.contains(HISTORY_RESULTS_STORE)) {
          db.createObjectStore(HISTORY_RESULTS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

// Gallery functions
export const getGalleryImage = async (key: number) =>
  (await getDb()).get(GALLERY_STORE, key);
export const getAllGalleryImageKeys = async () =>
  (await getDb()).getAllKeys(GALLERY_STORE);
export const addGalleryImage = async (key: number, image: Blob) =>
  (await getDb()).put(GALLERY_STORE, image, key);
export const deleteGalleryImage = async (key: number) =>
  (await getDb()).delete(GALLERY_STORE, key);
export const clearGalleryStore = async () => (await getDb()).clear(GALLERY_STORE);

// History image functions
export const addHistoryImage = async (key: number, image: Blob) =>
  (await getDb()).put(HISTORY_IMAGES_STORE, image, key);
export const getHistoryImage = async (key: number) =>
  (await getDb()).get(HISTORY_IMAGES_STORE, key);
export const deleteHistoryImage = async (key: number) =>
  (await getDb()).delete(HISTORY_IMAGES_STORE, key);
export const clearHistoryImagesStore = async () =>
  (await getDb()).clear(HISTORY_IMAGES_STORE);

// History result functions
export const addHistoryResult = async (key: number, result: HistoryResult) =>
  (await getDb()).put(HISTORY_RESULTS_STORE, result, key);
export const getHistoryResult = async (key: number) =>
  (await getDb()).get(HISTORY_RESULTS_STORE, key);
export const getAllHistoryResults = async () =>
  (await getDb()).getAll(HISTORY_RESULTS_STORE);
export const deleteHistoryResult = async (key: number) =>
  (await getDb()).delete(HISTORY_RESULTS_STORE, key);
export const clearHistoryResultsStore = async () =>
  (await getDb()).clear(HISTORY_RESULTS_STORE);
