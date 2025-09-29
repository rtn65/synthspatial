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
import {useEffect, useRef} from 'react';
import {Content} from './Content';
import {DatasetPanel} from './DatasetPanel';
import {ExtraModeControls} from './ExtraModeControls';
import {GalleryPanel} from './GalleryPanel';
import {HistoryPanel} from './HistoryPanel';
import {InputPanel} from './InputPanel';
import {TopBar} from './TopBar';
import {DetectTypes, Theme} from './Types';
import {
  DetectTypeAtom,
  GalleryImagesAtom,
  HistoryAtom,
  HistoryItemToLoadAtom,
  ImageSrcAtom,
  InitFinishedAtom,
  IsUploadedImageAtom,
  ThemeAtom,
} from './atoms';
import {imageOptions} from './consts';
import {getAllGalleryImageKeys, getHistoryImage} from './db';
import {useResetState} from './hooks';
import {hash} from './utils';

const HISTORY_KEY = 'detection-history';
const THEME_KEY = 'theme';

function App() {
  const [imageSrc, setImageSrc] = useAtom(ImageSrcAtom);
  const resetState = useResetState();
  const [initFinished] = useAtom(InitFinishedAtom);
  const setDetectType = useSetAtom(DetectTypeAtom);
  const setHistory = useSetAtom(HistoryAtom);
  const [itemToLoad] = useAtom(HistoryItemToLoadAtom);
  const setGalleryImageKeys = useSetAtom(GalleryImagesAtom);
  const setIsUploadedImage = useSetAtom(IsUploadedImageAtom);
  const [theme, setTheme] = useAtom(ThemeAtom);
  const previousObjectUrl = useRef<string | null>(null);

  // Load theme from localStorage on initial load
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme as Theme);
    }
  }, [setTheme]);

  // Apply and persist theme changes
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      mediaQuery.addEventListener('change', handleSystemChange);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [theme]);

  // Load history (metadata) and gallery (keys) on initial load
  useEffect(() => {
    // Load history metadata from localStorage
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
    // Load gallery keys from IndexedDB
    getAllGalleryImageKeys()
      .then((keys) => {
        setGalleryImageKeys(keys.sort((a, b) => b - a));
      })
      .catch((e) => console.error('Failed to load gallery keys from DB', e));
  }, [setHistory, setGalleryImageKeys]);

  // Orchestrator for loading a history item's global state
  useEffect(() => {
    if (itemToLoad) {
      resetState();

      // Revoke the previous object URL if it exists
      if (previousObjectUrl.current) {
        URL.revokeObjectURL(previousObjectUrl.current);
      }

      getHistoryImage(itemToLoad.imageSrc).then((blob) => {
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          previousObjectUrl.current = objectUrl;
          setImageSrc(objectUrl);
        }
      });

      setDetectType(itemToLoad.detectType);
      setIsUploadedImage(true); // Assume history items are like uploads
    }
  }, [itemToLoad, resetState, setImageSrc, setDetectType, setIsUploadedImage]);

  useEffect(() => {
    // FIX: Set initial image after async loading.
    if (!imageSrc) {
      imageOptions.then((images) => {
        setImageSrc(images[0]);
      });
    }

    const params = hash();
    const taskParam = params.task;

    if (taskParam) {
      let newDetectType: DetectTypes | null = null;
      switch (taskParam) {
        case '2d-bounding-boxes':
          newDetectType = '2D bounding boxes';
          break;
        case 'segmentation-masks':
          newDetectType = 'Segmentation masks';
          break;
        case 'points':
          newDetectType = 'Points';
          break;
        case '3d-bounding-boxes':
          newDetectType = '3D bounding boxes';
          break;
        default:
          console.warn(`Unknown task parameter in URL hash: ${taskParam}`);
      }
      if (newDetectType) {
        setDetectType(newDetectType);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDetectType]);

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex grow flex-col border-b overflow-hidden">
        <TopBar />
        {initFinished ? <Content /> : null}
        <ExtraModeControls />
      </div>
      <InputPanel />
      <HistoryPanel />
      <GalleryPanel />
      <DatasetPanel />
    </div>
  );
}

export default App;
