/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
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

import {useSetAtom} from 'jotai';
import {
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  BumpSessionAtom,
  GalleryImagesAtom,
  GeneratedImageSrcAtom,
  HistoryAtom,
  ImageSentAtom,
  PointsAtom,
} from './atoms';
import {
  addGalleryImage,
  addHistoryImage,
  addHistoryResult,
  clearGalleryStore,
  clearHistoryImagesStore,
  clearHistoryResultsStore,
  deleteGalleryImage,
  deleteHistoryImage,
  deleteHistoryResult,
} from './db';
import {HistoryItem, HistoryResult} from './Types';
import {dataURLtoBlob} from './utils';

export function useResetState() {
  // fix: Use useSetAtom to get a stable setter function and avoid type inference issues.
  const setImageSent = useSetAtom(ImageSentAtom);
  const setBoundingBoxes2D = useSetAtom(BoundingBoxes2DAtom);
  const setBoundingBoxes3D = useSetAtom(BoundingBoxes3DAtom);
  const setBoundingBoxMasks = useSetAtom(BoundingBoxMasksAtom);
  const setPoints = useSetAtom(PointsAtom);
  const setBumpSession = useSetAtom(BumpSessionAtom);
  const setGeneratedImageSrc = useSetAtom(GeneratedImageSrcAtom);

  return () => {
    setImageSent(false);
    setBoundingBoxes2D([]);
    setBoundingBoxes3D([]);
    setBoundingBoxMasks([]);
    setBumpSession((prev) => prev + 1);
    setPoints([]);
    setGeneratedImageSrc(null);
  };
}

const HISTORY_KEY = 'detection-history'; // Will now store metadata only
const MAX_HISTORY_ITEMS = 30;

type AddHistoryItemArgs = Omit<
  HistoryItem,
  'id' | 'timestamp' | 'imageSrc' | 'thumbnail' | 'resultThumbnail'
> & {
  imageSrc: string; // dataURL
  thumbnail: string; // dataURL
  resultThumbnail?: string; // dataURL
  result?: HistoryResult;
};

export function useManageHistory() {
  const setHistory = useSetAtom(HistoryAtom);

  const addHistoryItem = async (itemArgs: AddHistoryItemArgs) => {
    const id = Date.now();
    const {
      imageSrc,
      thumbnail,
      resultThumbnail,
      result,
      ...metadata
    } = itemArgs;

    // Store images in IndexedDB
    const imageBlob = dataURLtoBlob(imageSrc);
    await addHistoryImage(id, imageBlob);

    const thumbId = id + 1;
    const thumbBlob = dataURLtoBlob(thumbnail);
    await addHistoryImage(thumbId, thumbBlob);

    const newItem: HistoryItem = {
      ...metadata,
      id: id,
      timestamp: id,
      imageSrc: id,
      thumbnail: thumbId,
    };

    if (resultThumbnail) {
      const resultThumbId = id + 2;
      const resultThumbBlob = dataURLtoBlob(resultThumbnail);
      await addHistoryImage(resultThumbId, resultThumbBlob);
      newItem.resultThumbnail = resultThumbId;
    }

    if (result) {
      await addHistoryResult(id, result);
    }

    setHistory((prev) => {
      const updatedHistory = [newItem, ...prev];
      if (updatedHistory.length > MAX_HISTORY_ITEMS) {
        const itemToRemove = updatedHistory.pop()!;
        // Clean up DB entries for the removed item
        deleteHistoryImage(itemToRemove.imageSrc);
        deleteHistoryImage(itemToRemove.thumbnail);
        if (itemToRemove.resultThumbnail) {
          deleteHistoryImage(itemToRemove.resultThumbnail);
        }
        deleteHistoryResult(itemToRemove.id);
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const clearHistory = async () => {
    localStorage.removeItem(HISTORY_KEY);
    await clearHistoryImagesStore();
    await clearHistoryResultsStore();
    setHistory([]);
  };

  return {addHistoryItem, clearHistory};
}

const MAX_GALLERY_ITEMS = 50;

export function useManageGallery() {
  const setGalleryKeys = useSetAtom(GalleryImagesAtom);

  const addGalleryItem = async (imageDataUrl: string) => {
    const key = Date.now();
    const blob = dataURLtoBlob(imageDataUrl);
    await addGalleryImage(key, blob);

    setGalleryKeys((prev) => {
      const updatedKeys = [key, ...prev];
      if (updatedKeys.length > MAX_GALLERY_ITEMS) {
        const keyToRemove = updatedKeys.pop()!;
        deleteGalleryImage(keyToRemove);
      }
      return updatedKeys;
    });
  };

  const clearGallery = async () => {
    await clearGalleryStore();
    setGalleryKeys([]);
  };

  return {addGalleryItem, clearGallery};
}
