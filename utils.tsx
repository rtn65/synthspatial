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

import {getAllHistoryResults} from './db';
import {BoundingBox2DType, HistoryItem, HistoryResult} from './Types';

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );

  d.push('Z');
  return d.join(' ');
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export function hash(): Record<string, string> {
  const hashVal = window.location.hash.substring(1);
  const params: Record<string, string> = {};
  if (hashVal) {
    hashVal.split('&').forEach((hk) => {
      const temp = hk.split('=', 2); // Split into at most 2 parts.
      if (temp[0]) {
        params[temp[0]] = temp[1] ? decodeURIComponent(temp[1]) : '';
      }
    });
  }
  return params;
}

export async function createThumbnail(
  dataUrl: string,
  size = 128,
): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const aspectRatio = image.width / image.height;
  if (aspectRatio > 1) {
    canvas.width = size;
    canvas.height = size / aspectRatio;
  } else {
    canvas.width = size * aspectRatio;
    canvas.height = size;
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || arr.length < 2) {
    throw new Error('Invalid data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type: mime});
}

export async function exportToCoco(history: HistoryItem[]) {
  const coco: {
    info: any;
    licenses: any[];
    images: any[];
    annotations: any[];
    categories: any[];
  } = {
    info: {
      description: 'Dataset exported from Gemini App',
      year: new Date().getFullYear(),
      version: '1.0',
      date_created: new Date().toISOString(),
    },
    licenses: [],
    images: [],
    annotations: [],
    categories: [],
  };

  const categoryMap = new Map<string, number>();
  let annotationId = 1;
  const imageMap = new Map<number, number>();

  const allResults = await getAllHistoryResults();
  const resultsMap = new Map<number, HistoryResult>();
  allResults.forEach((res, key) => {
    if (res) {
      resultsMap.set(key, res);
    }
  });

  for (const item of history) {
    if (item.detectType !== '2D bounding boxes') continue;

    if (!imageMap.has(item.imageSrc)) {
      const imageId = coco.images.length + 1;
      imageMap.set(item.imageSrc, imageId);
      coco.images.push({
        id: imageId,
        width: item.imageWidth,
        height: item.imageHeight,
        file_name: `image_${item.id}.jpg`,
        license: null,
        date_captured: new Date(item.timestamp).toISOString(),
      });
    }

    const imageId = imageMap.get(item.imageSrc)!;
    const result = resultsMap.get(item.id) as BoundingBox2DType[] | undefined;

    if (result) {
      for (const box of result) {
        if (!categoryMap.has(box.label)) {
          const categoryId = coco.categories.length + 1;
          categoryMap.set(box.label, categoryId);
          coco.categories.push({
            id: categoryId,
            name: box.label,
            supercategory: 'object',
          });
        }
        const categoryId = categoryMap.get(box.label)!;

        // Convert normalized coordinates to absolute pixel values
        const absX = box.x * item.imageWidth;
        const absY = box.y * item.imageHeight;
        const absWidth = box.width * item.imageWidth;
        const absHeight = box.height * item.imageHeight;

        coco.annotations.push({
          id: annotationId++,
          image_id: imageId,
          category_id: categoryId,
          bbox: [absX, absY, absWidth, absHeight],
          area: absWidth * absHeight,
          iscrowd: 0,
          segmentation: [],
        });
      }
    }
  }

  // Trigger download
  const jsonString = JSON.stringify(coco, null, 2);
  const blob = new Blob([jsonString], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dataset.coco.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
