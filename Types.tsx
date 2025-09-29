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

import {PointingType} from './atoms';

export type DetectTypes =
  | '2D bounding boxes'
  | 'Segmentation masks'
  | '3D bounding boxes'
  | 'Points'
  | 'Image Editing';

export type Theme = 'light' | 'dark' | 'system';

export type BoundingBox2DType = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type BoundingBoxMaskType = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  imageData: string;
};

export type BoundingBox3DType = {
  center: [number, number, number];
  size: [number, number, number];
  rpy: [number, number, number];
  label: string;
};

// History Types
export type PromptState = {
  // For 2D
  targetPrompt?: string;
  labelPrompt?: string;
  // For Segmentation
  itemsPrompt?: string;
  segmentationLanguage?: string;
  // For Image Editing
  editPrompt?: string;
  // For others (Points, 3D)
  genericItemsPrompt?: string;
};

export type HistoryResult =
  | BoundingBox2DType[]
  | BoundingBox3DType[]
  | BoundingBoxMaskType[]
  | PointingType[]
  | string; // for generated image src

export type HistoryItem = {
  id: number;
  timestamp: number;
  imageSrc: number; // Key to IndexedDB blob
  imageWidth: number;
  imageHeight: number;
  detectType: DetectTypes;
  promptState: PromptState;
  thumbnail: number; // Key to IndexedDB blob
  resultThumbnail?: number; // Optional key for image editing result thumbnail
  isCurated?: boolean;
};
