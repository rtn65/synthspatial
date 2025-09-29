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
import {useEffect, useState} from 'react';
import {
  HistoryAtom,
  HistoryItemToLoadAtom,
  IsHistoryPanelOpenAtom,
} from './atoms';
import {getHistoryImage} from './db';
import {useManageHistory} from './hooks';
import {HistoryItem} from './Types';
import {exportToCoco} from './utils';

function Thumbnail({imageId}: {imageId: number}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    getHistoryImage(imageId).then((blob) => {
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
  }, [imageId]);

  return imageUrl ? (
    <img
      src={imageUrl}
      alt="Task thumbnail"
      className="w-16 h-16 object-cover rounded"
    />
  ) : (
    <div className="w-16 h-16 bg-[var(--input-color)] rounded" />
  );
}

export function HistoryPanel() {
  const [isOpen, setIsOpen] = useAtom(IsHistoryPanelOpenAtom);
  const [history] = useAtom(HistoryAtom);
  const {clearHistory} = useManageHistory();
  const setItemToLoad = useSetAtom(HistoryItemToLoadAtom);

  if (!isOpen) return null;

  function handleLoadItem(item: HistoryItem) {
    setItemToLoad(item);
  }

  function handleExport() {
    exportToCoco(history);
  }

  const has2dDetections = history.some(
    (item) => item.detectType === '2D bounding boxes',
  );

  return (
    <div className={`history-panel ${isOpen ? 'open' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">Detection History</h2>
        <button onClick={() => setIsOpen(false)} className="secondary !px-3">
          &times;
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4">
        {history.length === 0 ? (
          <p className="text-center text-[var(--text-color-secondary)]">
            No history yet. Run a detection task to see it here.
          </p>
        ) : (
          <ul className="space-y-4">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-4 p-3 border rounded-lg bg-[var(--input-color)]">
                <div className="flex gap-2">
                  <Thumbnail imageId={item.thumbnail} />
                  {item.resultThumbnail && (
                    <Thumbnail imageId={item.resultThumbnail} />
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-bold">
                    {item.detectType}
                    {item.isCurated && (
                      <span className="ml-2" title="Curated">
                        🔖
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[var(--text-color-secondary)]">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleLoadItem(item)}
                    className="secondary mt-2 !py-1 !text-sm">
                    Load
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-4 border-t space-y-2">
        <button
          onClick={handleExport}
          disabled={!has2dDetections}
          className="w-full secondary disabled:opacity-50 disabled:cursor-not-allowed">
          Export to COCO (2D Boxes)
        </button>
        <button
          onClick={() => clearHistory()}
          disabled={history.length === 0}
          className="w-full secondary disabled:opacity-50 disabled:cursor-not-allowed">
          Clear All History
        </button>
      </div>
    </div>
  );
}
