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

import {useAtom, useSetAtom} from 'jotai';
import {useEffect, useState, FunctionComponent} from 'react';
import {
  ImageSrcAtom,
  IsDatasetPanelOpenAtom,
  IsUploadedImageAtom,
} from './atoms';
import {datasetImageOptions} from './consts';
import {useResetState} from './hooks';

// FIX: Explicitly type DatasetThumbnail as a FunctionComponent to resolve typing issue with the `key` prop.
const DatasetThumbnail: FunctionComponent<{
  src: string;
  onSelect: (src: string) => void;
}> = ({src, onSelect}) => {
  return (
    <button
      className="aspect-square w-full h-full p-0 border-none rounded overflow-hidden bg-[var(--input-color)]"
      onClick={() => onSelect(src)}>
      <img
        src={src}
        alt="Dataset image"
        className="w-full h-full object-cover"
      />
    </button>
  );
};

export function DatasetPanel() {
  const [isOpen, setIsOpen] = useAtom(IsDatasetPanelOpenAtom);
  const [images, setImages] = useState<string[]>([]);
  const setImageSrc = useSetAtom(ImageSrcAtom);
  const setIsUploadedImage = useSetAtom(IsUploadedImageAtom);
  const resetState = useResetState();

  useEffect(() => {
    datasetImageOptions.then(setImages);
  }, []);

  if (!isOpen) return null;

  function handleSelectImage(src: string) {
    resetState();
    setImageSrc(src);
    setIsUploadedImage(false);
    setIsOpen(false);
  }

  return (
    <div className={`dataset-panel ${isOpen ? 'open' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">Dataset Gallery</h2>
        <button onClick={() => setIsOpen(false)} className="secondary !px-3">
          &times;
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {images.length === 0 ? (
          <p className="text-center text-[var(--text-color-secondary)]">
            Loading dataset...
          </p>
        ) : (
          <div className="gallery-grid">
            {images.map((src) => (
              <DatasetThumbnail
                key={src}
                src={src}
                onSelect={handleSelectImage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
