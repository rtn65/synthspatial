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
import {DetectTypeAtom, GeneratedImageSrcAtom, HoverEnteredAtom} from './atoms';
import {DetectTypes} from './Types';

export function DetectTypeSelector() {
  const [detectType, setDetectType] = useAtom(DetectTypeAtom);
  const setHoverEntered = useSetAtom(HoverEnteredAtom);
  const setGeneratedImageSrc = useSetAtom(GeneratedImageSrcAtom);

  const options = [
    '2D bounding boxes',
    'Segmentation masks',
    'Points',
    '3D bounding boxes',
    'Image Editing',
  ];

  return (
    <div className="detect-type-selector">
      <div className="input-sources-label">Task</div>
      <div className="detect-type-options">
        {options.map((label) => (
          <button
            key={label}
            className={`detect-type-button ${
              detectType === label ? 'active' : ''
            }`}
            onClick={() => {
              setHoverEntered(false);
              if (detectType !== label) {
                setGeneratedImageSrc(null);
              }
              setDetectType(label as DetectTypes);
            }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
