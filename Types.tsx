
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

/**
 * Supported detection and generation task types.
 */
export type DetectTypes =
  | 'Synthetic Generation'
  | '2D bounding boxes'
  | 'Segmentation masks'
  | 'Points'
  | '3D bounding boxes';

export type Theme = 'light' | 'dark' | 'system';

export type GalleryImageMetadata = {
  projectId: number;
  qualityScore: number;
  qualityFeedback: string;
  improvementSuggestion?: string;
  userRating?: 'up' | 'down' | null;
  userComment?: string;
};

// Region of Interest Types
export type ROIRectangle = {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
};
export type ROIPolygon = {
  id: string;
  type: 'polygon';
  points: Array<{x: number; y: number}>;
  isFinished: boolean;
};
export type ROICircle = {
  id: string;
  type: 'circle';
  x: number; // center x
  y: number; // center y
  radius: number;
};
export type ROIFreehand = {
  id: string;
  type: 'freehand';
  points: Array<{x: number; y: number}>;
};
export type ROIBrush = {
  id: string;
  type: 'brush';
  points: Array<{x: number; y: number}>;
  strokeWidth: number;
  opacity: number;
  brushShape: 'round' | 'square';
};

export type ROIShape = ROIRectangle | ROIPolygon | ROICircle | ROIFreehand | ROIBrush;
export type ROI = ROIShape[];

// Project Types
export type Project = {
  id: number;
  name: string;
};

// History Types
export type PromptState = {
  editPrompt?: string;
};

/**
 * Interface for 2D bounding box results.
 */
export interface BoundingBox2DType {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The result of a history item can be a generated image URL or a set of bounding boxes.
 */
export type HistoryResult = string | BoundingBox2DType[];

export type HistoryItem = {
  id: number;
  projectId: number;
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
