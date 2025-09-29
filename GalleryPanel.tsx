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
// FIX: Explicitly type GalleryThumbnail as a FunctionComponent to resolve typing issue with the `key` prop.
import {useEffect, useState, FunctionComponent} from 'react';
import {
  GalleryImagesAtom,
  ImageSrcAtom,
  IsGalleryPanelOpenAtom,
  IsUploadedImageAtom,
} from './atoms';
import {getGalleryImage} from './db';
import {useManageGallery, useResetState} from './hooks';
import JSZip from 'jszip';

// FIX: Changed GalleryThumbnail from a function declaration to a const arrow function.
// This helps TypeScript correctly identify it as a React component that accepts a 'key' prop.
const GalleryThumbnail: FunctionComponent<{
  id: number;
  onSelect: (id: number) => any;
}> = ({id, onSelect}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    getGalleryImage(id).then((blob) => {
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      }
    });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  return (
    <button
      className="aspect-square w-full h-full p-0 border-none rounded overflow-hidden bg-[var(--input-color)]"
      onClick={() => onSelect(id)}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Generated image ${id}`}
          className="w-full h-full object-cover"
        />
      )}
    </button>
  );
};

export function GalleryPanel() {
  const [isOpen, setIsOpen] = useAtom(IsGalleryPanelOpenAtom);
  const [galleryImageKeys] = useAtom(GalleryImagesAtom);
  const {clearGallery} = useManageGallery();
  const setImageSrc = useSetAtom(ImageSrcAtom);
  const setIsUploadedImage = useSetAtom(IsUploadedImageAtom);
  const resetState = useResetState();
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  async function handleSelectImage(id: number) {
    resetState();
    const blob = await getGalleryImage(id);
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setImageSrc(objectUrl);
      setIsUploadedImage(true); // Treat it like an upload
      setIsOpen(false); // Close panel on selection
    }
  }

  async function handleExport() {
    if (galleryImageKeys.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      const zip = new JSZip();
      const imageFolder = zip.folder('gallery-images');

      if (imageFolder) {
        await Promise.all(
          galleryImageKeys.map(async (id) => {
            const blob = await getGalleryImage(id);
            if (blob) {
              // All generated images are PNGs from the editing flow.
              imageFolder.file(`image-${id}.png`, blob);
            }
          }),
        );
      }

      const content = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gallery-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export gallery images:', error);
      // Consider adding a user-facing error message here
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={`gallery-panel ${isOpen ? 'open' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">Image Gallery</h2>
        <button onClick={() => setIsOpen(false)} className="secondary !px-3">
          &times;
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {galleryImageKeys.length === 0 ? (
          <p className="text-center text-[var(--text-color-secondary)]">
            Your generated images will appear here.
          </p>
        ) : (
          <div className="gallery-grid">
            {galleryImageKeys.map((id) => (
              <GalleryThumbnail key={id} id={id} onSelect={handleSelectImage} />
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t space-y-2">
        <button
          onClick={handleExport}
          disabled={galleryImageKeys.length === 0 || isExporting}
          className="w-full secondary disabled:opacity-50 disabled:cursor-not-allowed">
          {isExporting ? 'Exporting...' : 'Export All as ZIP'}
        </button>
        <button
          onClick={() => clearGallery()}
          disabled={galleryImageKeys.length === 0 || isExporting}
          className="w-full secondary disabled:opacity-50 disabled:cursor-not-allowed">
          Clear All
        </button>
      </div>
    </div>
  );
}