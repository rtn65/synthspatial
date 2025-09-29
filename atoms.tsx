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

import {atom} from 'jotai';
import {
  colors,
  defaultPromptParts,
  defaultPrompts,
} from './consts';
import {
  BoundingBox2DType,
  BoundingBox3DType,
  BoundingBoxMaskType,
  DetectTypes,
  HistoryItem,
  Theme,
} from './Types';

// FIX: Initialize with null as imageOptions is now a promise. It will be populated in App.tsx.
// Fix: Use type assertion to ensure atom is writable.
export const ImageSrcAtom = atom(null as string | null);

export const ImageSentAtom = atom(false);

export const BoundingBoxes2DAtom = atom<BoundingBox2DType[]>([]);

export const PromptsAtom = atom<Record<string, string[]>>({
  ...defaultPromptParts,
});
export const CustomPromptsAtom = atom<Record<string, string>>({
  ...defaultPrompts,
});

export type PointingType = {
  point: {
    x: number;
    y: number;
  };
  label: string;
};

export const RevealOnHoverModeAtom = atom<boolean>(true);

export const FOVAtom = atom<number>(60);

export const BoundingBoxes3DAtom = atom<BoundingBox3DType[]>([]);

export const BoundingBoxMasksAtom = atom<BoundingBoxMaskType[]>([]);

export const PointsAtom = atom<PointingType[]>([]);

// export const PromptAtom = atom<string>("main objects");

export const TemperatureAtom = atom<number>(0.5);

// Fix: Use type assertion to ensure atom is writable.
export const ShareStream = atom(null as MediaStream | null);

export const DrawModeAtom = atom<boolean>(false);

export const DetectTypeAtom = atom<DetectTypes>('2D bounding boxes');

export const LinesAtom = atom<[[number, number][], string][]>([]);

export const JsonModeAtom = atom(false);

export const ActiveColorAtom = atom(colors[6]);

export const HoverEnteredAtom = atom(false);

// Fix: Use type assertion to ensure atom is writable.
export const HoveredBoxAtom = atom(null as number | null);

export const VideoRefAtom = atom<{current: HTMLVideoElement | null}>({
  current: null,
});

export const InitFinishedAtom = atom(true);

export const BumpSessionAtom = atom(0);

export const IsUploadedImageAtom = atom(false);

export const IsLoadingAtom = atom(false);

// Fix: Use type assertion to ensure atom is writable.
export const GeneratedImageSrcAtom = atom(null as string | null);

// Theme Atom
export const ThemeAtom = atom<Theme>('system');

// History Atoms
export const IsHistoryPanelOpenAtom = atom(false);
export const HistoryAtom = atom<HistoryItem[]>([]);
// Fix: Use type assertion to ensure atom is writable.
export const HistoryItemToLoadAtom = atom(null as HistoryItem | null);

// Gallery Atoms
export const IsGalleryPanelOpenAtom = atom(false);
export const GalleryImagesAtom = atom<number[]>([]); // Store keys (numbers) instead of data URLs

// Dataset Gallery Atom
export const IsDatasetPanelOpenAtom = atom(false);
