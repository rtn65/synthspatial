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
// See the License for the a specific language governing permissions and
// limitations under the License.

import {useAtom} from 'jotai';
import {
  DetectTypeAtom,
  HoverEnteredAtom,
  IsDatasetPanelOpenAtom,
  IsGalleryPanelOpenAtom,
  IsHistoryPanelOpenAtom,
  RevealOnHoverModeAtom,
  ThemeAtom,
} from './atoms';
import {useResetState} from './hooks';

export function TopBar() {
  const resetState = useResetState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [isHistoryOpen, setIsHistoryOpen] = useAtom(IsHistoryPanelOpenAtom);
  const [isGalleryOpen, setIsGalleryOpen] = useAtom(IsGalleryPanelOpenAtom);
  const [isDatasetOpen, setIsDatasetOpen] = useAtom(IsDatasetPanelOpenAtom);
  const [theme, setTheme] = useAtom(ThemeAtom);
  const isDetection =
    detectType === '2D bounding boxes' || detectType === 'Segmentation masks';

  function handleThemeToggle() {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  }

  function getThemeIcon() {
    switch (theme) {
      case 'light':
        return '☀️'; // Sun for light mode
      case 'dark':
        return '🌙'; // Moon for dark mode
      case 'system':
      default:
        return '🖥️'; // Computer for system mode
    }
  }

  return (
    <div className="flex w-full items-center px-3 py-2 border-b justify-between">
      <div className="flex gap-3 items-center">
        <button
          onClick={() => {
            resetState();
          }}
          className="!p-0 !border-none underline bg-transparent"
          style={{
            minHeight: '0',
          }}>
          <div>Reset session</div>
        </button>
      </div>
      <div className="flex gap-3 items-center">
        {isDetection ? (
          <label className="flex items-center gap-2 px-3 select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={revealOnHover}
              onChange={(e) => {
                if (e.target.checked) {
                  setHoverEntered(false);
                }
                setRevealOnHoverMode(e.target.checked);
              }}
            />
            <span className="hidden sm:block">reveal on hover</span>
          </label>
        ) : null}
        <button
          onClick={handleThemeToggle}
          className="secondary !px-3"
          aria-label={`Toggle theme (current: ${theme})`}>
          {getThemeIcon()}
        </button>
        <button
          onClick={() => setIsDatasetOpen(!isDatasetOpen)}
          className="secondary !px-3"
          aria-label="Toggle dataset gallery panel">
          📚
        </button>
        <button
          onClick={() => setIsGalleryOpen(!isGalleryOpen)}
          className="secondary !px-3"
          aria-label="Toggle gallery panel">
          🖼️
        </button>
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="secondary !px-3"
          aria-label="Toggle history panel">
          🕒
        </button>
      </div>
    </div>
  );
}
