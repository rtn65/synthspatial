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

import {GoogleGenAI, Modality, Type} from '@google/genai';
import {useAtom, useSetAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  BoundingBoxMasksAtom,
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  CustomPromptsAtom,
  DetectTypeAtom,
  GeneratedImageSrcAtom,
  HistoryAtom,
  HistoryItemToLoadAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  IsHistoryPanelOpenAtom,
  IsLoadingAtom,
  LinesAtom,
  PointsAtom,
  PromptsAtom,
  ShareStream,
  TemperatureAtom,
  VideoRefAtom,
} from './atoms';
import {defaultPromptParts, lineOptions} from './consts';
import {useManageGallery, useManageHistory} from './hooks';
import {DetectTypes, HistoryResult, PromptState} from './Types';
import {createThumbnail, getSvgPathFromStroke, loadImage} from './utils';

// fix: Use process.env.API_KEY and initialize with a named parameter per coding guidelines.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

interface RichTextInputProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
  rows?: number;
  resize?: 'none' | 'vertical';
}

function RichTextInput({
  value,
  onChange,
  placeholder,
  disabled,
  onKeyDown,
  className,
  rows = 1,
  resize = 'none',
}: RichTextInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state to editor, but only if it's different to prevent cursor jumps.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      onChange(e.currentTarget.innerHTML);
    },
    [onChange],
  );

  // Estimate height from rows
  const minHeight = `${rows * 1.5 + (rows > 1 ? 1 : 0.5) * 2}rem`;

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      onInput={handleInput}
      onKeyDown={onKeyDown}
      className={`rich-text-input ${className}`}
      style={{
        minHeight,
        resize,
        overflow: 'auto',
      }}
      data-placeholder={placeholder}
      suppressContentEditableWarning={true}
    />
  );
}

export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const setBoundingBoxes2D = useSetAtom(BoundingBoxes2DAtom);
  const setBoundingBoxes3D = useSetAtom(BoundingBoxes3DAtom);
  const setBoundingBoxMasks = useSetAtom(BoundingBoxMasksAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const setPoints = useSetAtom(PointsAtom);
  const setHoverEntered = useSetAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [showCustomPrompt] = useState(false);
  const [targetPrompt, setTargetPrompt] = useState('items');
  const [labelPrompt, setLabelPrompt] = useState('');
  const [segmentationLanguage, setSegmentationLanguage] = useState('English');
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const [editPrompt, setEditPrompt] = useState(
    'Add a birthday hat on the cat.',
  );
  const setGeneratedImageSrc = useSetAtom(GeneratedImageSrcAtom);

  const [prompts, setPrompts] = useAtom(PromptsAtom);
  const [customPrompts, setCustomPrompts] = useAtom(CustomPromptsAtom);
  const [isLoading, setIsLoading] = useAtom(IsLoadingAtom);
  const [history, setHistory] = useAtom(HistoryAtom);

  const {addHistoryItem} = useManageHistory();
  const {addGalleryItem} = useManageGallery();
  const [itemToLoad, setItemToLoad] = useAtom(HistoryItemToLoadAtom);
  const setIsHistoryPanelOpen = useSetAtom(IsHistoryPanelOpenAtom);

  // State for prompt suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // State for prompt improvement
  const [isImproving, setIsImproving] = useState(false);

  // State for batch generation
  const [batchCount, setBatchCount] = useState(4);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Listener to load a history item's local prompt state
  useEffect(() => {
    if (itemToLoad) {
      const {promptState, detectType: historyDetectType} = itemToLoad;

      // Apply state from the loaded history item, falling back to defaults for any missing values.
      // This effectively resets and sets the state in one go.
      setTargetPrompt(promptState.targetPrompt ?? 'items');
      setLabelPrompt(promptState.labelPrompt ?? '');
      setEditPrompt(
        promptState.editPrompt ?? 'Add a birthday hat on the cat.',
      );
      setSegmentationLanguage(promptState.segmentationLanguage ?? 'English');

      // Reset the prompts atom to default, then apply history value.
      const newPromptsState = {...defaultPromptParts}; // Start from default
      if (
        historyDetectType === 'Segmentation masks' &&
        promptState.itemsPrompt
      ) {
        newPromptsState['Segmentation masks'][1] = promptState.itemsPrompt;
      } else if (promptState.genericItemsPrompt) {
        if (newPromptsState[historyDetectType]) {
          newPromptsState[historyDetectType][1] =
            promptState.genericItemsPrompt;
        }
      }
      setPrompts(newPromptsState);

      // Clean up and close panel
      setItemToLoad(null);
      setIsHistoryPanelOpen(false);
    }
  }, [itemToLoad, setItemToLoad, setIsHistoryPanelOpen, setPrompts]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const is2d = detectType === '2D bounding boxes';
  const isImageEditing = detectType === 'Image Editing';

  const get2dPrompt = () =>
    `Detect ${targetPrompt}, with no more than 20 items. Output a json list where each entry contains the 2D bounding box in "box_2d" and ${
      labelPrompt || 'a text label'
    } in "label".`;

  const getSegmentationPrompt = () => {
    const promptParts = prompts['Segmentation masks'];
    const prefix = promptParts[0];
    const items = promptParts[1]; // User-editable "items"
    let suffix = promptParts[2];

    const originalLabelInstruction =
      ' text label in the key "label". Use descriptive labels.';

    if (
      segmentationLanguage &&
      segmentationLanguage.trim() !== '' &&
      segmentationLanguage.toLowerCase() !== 'english'
    ) {
      if (suffix.endsWith(originalLabelInstruction)) {
        suffix = suffix.substring(
          0,
          suffix.length - originalLabelInstruction.length,
        );
      }
      suffix += ` text label in language ${segmentationLanguage} in the key "label". Use descriptive labels in ${segmentationLanguage}. Ensure labels are in ${segmentationLanguage}.  DO NOT USE ENGLISH FOR LABELS.`;
    }
    return `${prefix} ${items}${suffix}`;
  };

  const getGenericPrompt = (type: DetectTypes) => {
    if (!prompts[type] || prompts[type].length < 3)
      return prompts[type]?.join(' ') || '';
    const [p0, p1, p2] = prompts[type];
    return `${p0} ${p1}${p2}`;
  };

  async function getActiveImageDataUrl() {
    const maxSize = 640;
    const copyCanvas = document.createElement('canvas');
    const ctx = copyCanvas.getContext('2d')!;
    let imageWidth = 0;
    let imageHeight = 0;

    if (stream) {
      const video = videoRef.current!;
      imageWidth = video.videoWidth;
      imageHeight = video.videoHeight;
      const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight);
      copyCanvas.width = imageWidth * scale;
      copyCanvas.height = imageHeight * scale;
      ctx.drawImage(video, 0, 0, copyCanvas.width, copyCanvas.height);
    } else if (imageSrc) {
      const image = await loadImage(imageSrc);
      imageWidth = image.naturalWidth;
      imageHeight = image.naturalHeight;
      const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight);
      copyCanvas.width = imageWidth * scale;
      copyCanvas.height = imageHeight * scale;
      ctx.drawImage(image, 0, 0, copyCanvas.width, copyCanvas.height);
    } else {
      return null;
    }

    if (lines.length > 0) {
      for (const line of lines) {
        const p = new Path2D(
          getSvgPathFromStroke(
            getStroke(
              line[0].map(([x, y]) => [
                x * copyCanvas.width,
                y * copyCanvas.height,
                0.5,
              ]),
              lineOptions,
            ),
          ),
        );
        ctx.fillStyle = line[1];
        ctx.fill(p);
      }
    }
    return {
      dataUrl: copyCanvas.toDataURL('image/png'),
      width: imageWidth,
      height: imageHeight,
    };
  }

  async function handleSuggestPrompts() {
    setIsSuggesting(true);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const imageData = await getActiveImageDataUrl();
      if (!imageData) return;

      const {dataUrl: activeDataURL} = imageData;
      let metaPrompt = '';
      if (isImageEditing) {
        metaPrompt =
          'Based on this image, suggest 3 creative and interesting prompts for editing it. The prompts should be short, actionable instructions.';
      } else {
        metaPrompt =
          'Based on this image, suggest 3 interesting types of objects to detect. The suggestions should be short phrases for what to detect (e.g., "all the cars", "the cat\'s whiskers", "every single fruit").';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: activeDataURL.replace('data:image/png;base64,', ''),
                mimeType: 'image/png',
              },
            },
            {text: metaPrompt},
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: 'A single prompt suggestion.',
            },
          },
        },
      });

      const parsedSuggestions = JSON.parse(response.text);
      if (Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0) {
        setSuggestions(parsedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    if (isImageEditing) {
      setEditPrompt(suggestion);
    } else if (is2d) {
      setTargetPrompt(suggestion);
    } else {
      const newPromptsState = {...prompts};
      if (!newPromptsState[detectType])
        newPromptsState[detectType] = ['', '', ''];
      newPromptsState[detectType][1] = suggestion;
      setPrompts(newPromptsState);
    }
    setShowSuggestions(false);
  }

  async function handleImprovePrompt() {
    setIsImproving(true);
    try {
      const imageData = await getActiveImageDataUrl();
      if (!imageData) return;

      let currentPrompt = '';
      if (isImageEditing) {
        currentPrompt = editPrompt;
      } else if (is2d) {
        currentPrompt = targetPrompt;
      } else {
        currentPrompt = prompts[detectType]?.[1] || '';
      }

      if (!currentPrompt.trim()) {
        return;
      }

      const {dataUrl: activeDataURL} = imageData;
      let metaPrompt = '';

      if (isImageEditing) {
        metaPrompt = `Based on the provided image, rewrite the following user prompt to be more descriptive and creative for an image editing task. Return only the improved prompt text, with no preamble. User prompt: "${currentPrompt}"`;
      } else {
        metaPrompt = `Based on the provided image, rewrite the following user prompt to be more specific and effective for an object detection task. Return only the improved prompt text, with no preamble. User prompt: "${currentPrompt}"`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: activeDataURL.replace('data:image/png;base64,', ''),
                mimeType: 'image/png',
              },
            },
            {text: metaPrompt},
          ],
        },
      });

      const improvedText = response.text.trim();

      if (improvedText) {
        if (isImageEditing) {
          setEditPrompt(improvedText);
        } else if (is2d) {
          setTargetPrompt(improvedText);
        } else {
          const newPromptsState = {...prompts};
          if (!newPromptsState[detectType])
            newPromptsState[detectType] = ['', '', ''];
          newPromptsState[detectType][1] = improvedText;
          setPrompts(newPromptsState);
        }
      }
    } catch (error) {
      console.error('Error improving prompt:', error);
    } finally {
      setIsImproving(false);
    }
  }

  async function generateSingleEditedImage(
    prompt: string,
    activeDataURL: string,
  ): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: activeDataURL.replace('data:image/png;base64,', ''),
                mimeType: 'image/png',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
          }
        }
      }
    } catch (error) {
      console.error('Single image generation failed:', error);
    }
    return null;
  }

  async function handleBatchGenerate() {
    if (!isImageEditing) return;

    setIsBatchGenerating(true);
    setIsLoading(true); // Block other buttons
    setGeneratedImageSrc(null); // Clear previous result

    try {
      const imageData = await getActiveImageDataUrl();
      if (!imageData) {
        return;
      }
      const {
        dataUrl: activeDataURL,
        width: imageWidth,
        height: imageHeight,
      } = imageData;

      const generationPromises = Array(batchCount)
        .fill(null)
        .map(() => generateSingleEditedImage(editPrompt, activeDataURL));

      const results = await Promise.all(generationPromises);

      let isFirstImage = true;
      for (const imageUrl of results) {
        if (imageUrl) {
          // Add all successful generations to the gallery
          await addGalleryItem(imageUrl);

          if (isFirstImage) {
            // Set the first image as the main preview
            setGeneratedImageSrc(imageUrl);

            // Create a history item just for the first image
            const promptState: PromptState = {editPrompt};
            const thumbnail = await createThumbnail(activeDataURL);
            const resultThumbnail = await createThumbnail(imageUrl);
            addHistoryItem({
              imageSrc: activeDataURL,
              imageWidth,
              imageHeight,
              detectType,
              promptState,
              thumbnail,
              resultThumbnail,
            });
            isFirstImage = false;
          }
        }
      }
    } catch (error) {
      console.error('Batch generation failed:', error);
    } finally {
      setIsBatchGenerating(false);
      setIsLoading(false);
    }
  }

  async function handleSend() {
    setIsLoading(true);
    if (isImageEditing) {
      setGeneratedImageSrc(null);
    }
    try {
      const imageData = await getActiveImageDataUrl();
      if (!imageData) {
        setIsLoading(false);
        return;
      }
      const {
        dataUrl: activeDataURL,
        width: imageWidth,
        height: imageHeight,
      } = imageData;

      setHoverEntered(false);

      const promptState: PromptState = {};
      let textPromptToSend = '';

      if (isImageEditing) {
        promptState.editPrompt = editPrompt;
        textPromptToSend = editPrompt;
      } else if (is2d) {
        promptState.targetPrompt = targetPrompt;
        promptState.labelPrompt = labelPrompt;
        textPromptToSend = get2dPrompt();
      } else if (detectType === 'Segmentation masks') {
        promptState.itemsPrompt = prompts['Segmentation masks'][1];
        promptState.segmentationLanguage = segmentationLanguage;
        textPromptToSend = getSegmentationPrompt();
      } else {
        promptState.genericItemsPrompt = prompts[detectType][1];
        textPromptToSend = getGenericPrompt(detectType);
      }

      if (isImageEditing) {
        const imageUrl = await generateSingleEditedImage(
          textPromptToSend,
          activeDataURL,
        );
        if (imageUrl) {
          setGeneratedImageSrc(imageUrl);
          addGalleryItem(imageUrl); // Add to gallery
          const thumbnail = await createThumbnail(activeDataURL);
          const resultThumbnail = await createThumbnail(imageUrl);
          addHistoryItem({
            imageSrc: activeDataURL,
            imageWidth,
            imageHeight,
            detectType,
            promptState,
            thumbnail,
            resultThumbnail,
          });
        }
        return;
      }

      const config: {
        temperature: number;
        thinkingConfig?: {thinkingBudget: number};
      } = {
        temperature,
      };
      // fix: Use recommended model 'gemini-2.5-flash' for all tasks.
      const model = 'gemini-2.5-flash';
      if (detectType !== '3D bounding boxes') {
        config['thinkingConfig'] = {thinkingBudget: 0};
      }

      let response = (
        await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  data: activeDataURL.replace('data:image/png;base64,', ''),
                  mimeType: 'image/png',
                },
              },
              {text: textPromptToSend},
            ],
          },
          config,
        })
      ).text;

      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0];
      }
      const parsedResponse = JSON.parse(response);
      let resultForHistory: HistoryResult | undefined;

      if (detectType === '2D bounding boxes') {
        const formattedBoxes = parsedResponse.map(
          (box: {box_2d: [number, number, number, number]; label: string}) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: box.label,
            };
          },
        );
        setHoverEntered(false);
        setBoundingBoxes2D(formattedBoxes);
        resultForHistory = formattedBoxes;
      } else if (detectType === 'Points') {
        const formattedPoints = parsedResponse.map(
          (point: {point: [number, number]; label: string}) => {
            return {
              point: {
                x: point.point[1] / 1000,
                y: point.point[0] / 1000,
              },
              label: point.label,
            };
          },
        );
        setPoints(formattedPoints);
        resultForHistory = formattedPoints;
      } else if (detectType === 'Segmentation masks') {
        const formattedBoxes = parsedResponse.map(
          (box: {
            box_2d: [number, number, number, number];
            label: string;
            mask: ImageData;
          }) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: box.label,
              imageData: box.mask,
            };
          },
        );
        setHoverEntered(false);
        // sort largest to smallest
        const sortedBoxes = formattedBoxes.sort(
          (a: any, b: any) => b.width * b.height - a.width * a.height,
        );
        setBoundingBoxMasks(sortedBoxes);
        resultForHistory = sortedBoxes;
      } else {
        const formattedBoxes = parsedResponse.map(
          (box: {
            box_3d: [
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
              number,
            ];
            label: string;
          }) => {
            const center = box.box_3d.slice(0, 3);
            const size = box.box_3d.slice(3, 6);
            const rpy = box.box_3d
              .slice(6)
              .map((x: number) => (x * Math.PI) / 180);
            return {
              center,
              size,
              rpy,
              label: box.label,
            };
          },
        );
        setBoundingBoxes3D(formattedBoxes);
        resultForHistory = formattedBoxes;
      }

      const thumbnail = await createThumbnail(activeDataURL);
      await addHistoryItem({
        imageSrc: activeDataURL,
        imageWidth,
        imageHeight,
        detectType,
        promptState,
        result: resultForHistory,
        thumbnail,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const lastItemIsCurated = !!history[0]?.isCurated;

  const handleCurate = () => {
    if (!history.length || history[0].isCurated) {
      return;
    }
    const updatedHistory = [...history];
    const lastItem = {...updatedHistory[0], isCurated: true};
    updatedHistory[0] = lastItem;

    setHistory(updatedHistory);
    localStorage.setItem('detection-history', JSON.stringify(updatedHistory));
  };

  return (
    <div className="prompt-container">
      <div className="prompt-input-wrapper">
        {isImageEditing ? (
          <>
            <div className="prompt-label px-4 pt-4 pb-2">Edit Instruction:</div>
            <RichTextInput
              className="px-4 pb-4"
              placeholder="e.g., Make the cat wear sunglasses"
              value={editPrompt}
              onChange={setEditPrompt}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              rows={3}
              resize="vertical"
            />
          </>
        ) : (
          <>
            <div className="flex justify-between items-center px-4 pt-4 pb-2">
              <div className="prompt-label">
                Prompt:{' '}
                <span className="font-normal normal-case">
                  {detectType === '3D bounding boxes'
                    ? 'Gemini 2.5 Flash'
                    : 'Gemini 2.5 Flash (no thinking)'}
                </span>
              </div>
              <label className="flex gap-2 select-none text-xs text-[var(--text-color-secondary)]">
                <input
                  type="checkbox"
                  checked={showRawPrompt}
                  onChange={() => setShowRawPrompt(!showRawPrompt)}
                  disabled={isLoading}
                />
                <div>show raw prompt</div>
              </label>
            </div>
            {showCustomPrompt ? (
              <textarea
                className="w-full bg-transparent resize-none p-4 pt-0"
                value={customPrompts[detectType]}
                onChange={(e) => {
                  const value = e.target.value;
                  const newPrompts = {...customPrompts};
                  newPrompts[detectType] = value;
                  setCustomPrompts(newPrompts);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
            ) : showRawPrompt ? (
              <div className="px-4 pb-4 text-sm text-[var(--text-color-secondary)]">
                {is2d
                  ? get2dPrompt()
                  : detectType === 'Segmentation masks'
                  ? getSegmentationPrompt()
                  : getGenericPrompt(detectType)}
              </div>
            ) : (
              <div className="px-4 pb-4 flex flex-col gap-3">
                <div className="text-sm text-[var(--text-color-secondary)]">
                  {is2d ? 'Detect' : prompts[detectType][0]}
                </div>
                <RichTextInput
                  placeholder="What kind of things do you want to detect?"
                  rows={1}
                  value={is2d ? targetPrompt : prompts[detectType][1]}
                  onChange={(value) => {
                    if (is2d) {
                      setTargetPrompt(value);
                    } else {
                      const newPromptsState = {...prompts};
                      if (!newPromptsState[detectType])
                        newPromptsState[detectType] = ['', '', ''];
                      newPromptsState[detectType][1] = value;
                      setPrompts(newPromptsState);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                />
                {detectType === 'Segmentation masks' && (
                  <>
                    <div className="mt-1 text-sm text-[var(--text-color-secondary)]">
                      Output labels in language: (e.g. Deutsch, Français,
                      Español, 中文)
                    </div>
                    <RichTextInput
                      aria-label="Language for segmentation labels"
                      rows={1}
                      placeholder="e.g., Deutsch"
                      value={segmentationLanguage}
                      onChange={setSegmentationLanguage}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isLoading}
                    />
                  </>
                )}
                {is2d && (
                  <>
                    <div className="text-sm text-[var(--text-color-secondary)]">
                      Label each one with: (optional)
                    </div>
                    <RichTextInput
                      rows={1}
                      placeholder="How do you want to label the things?"
                      value={labelPrompt}
                      onChange={setLabelPrompt}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isLoading}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="prompt-actions">
        <div className="prompt-actions-left">
          {(isImageEditing ||
            detectType === '2D bounding boxes' ||
            detectType === 'Segmentation masks' ||
            detectType === 'Points') && (
            <>
              <div className="relative">
                <button
                  className={`secondary action-button ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleSuggestPrompts}
                  disabled={isLoading}
                  title="Suggest prompts based on the image">
                  {isSuggesting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-[var(--text-color-primary)]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '💡'
                  )}
                  <span>Suggest</span>
                </button>

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute bottom-full mb-2 w-max max-w-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg z-10 text-left">
                    <ul className="py-1">
                      {suggestions.map((s, i) => (
                        <li
                          key={i}
                          className="px-4 py-2 hover:bg-[var(--border-color)] cursor-pointer"
                          onClick={() => handleSuggestionClick(s)}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                className={`secondary action-button ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleImprovePrompt}
                disabled={isLoading}
                title="Improve the current prompt">
                {isImproving ? (
                  <svg
                    className="animate-spin h-5 w-5 text-[var(--text-color-primary)]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  '✨'
                )}
                <span>Improve</span>
              </button>
              {!isImageEditing && (
                <button
                  className={`secondary action-button ${
                    lastItemIsCurated ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleCurate}
                  disabled={isLoading || !history.length || lastItemIsCurated}
                  title="Add the latest detection to your curated dataset for export.">
                  {'🔖'}
                  <span>{lastItemIsCurated ? 'Curated' : 'Curate'}</span>
                </button>
              )}
            </>
          )}
        </div>
        <div className="prompt-actions-right">
          {isImageEditing ? (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-[var(--text-color-secondary)]">
                Number:
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={batchCount}
                  onChange={(e) => {
                    const val = Math.max(
                      1,
                      Math.min(8, Number(e.target.value)),
                    );
                    setBatchCount(val);
                  }}
                  disabled={isLoading}
                  className="w-16 p-1 text-center bg-[var(--input-color)] border border-[var(--border-color)] rounded-md focus:border-[var(--accent-color)] focus:outline-none"
                />
              </label>
              <button
                className={`secondary action-button ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleBatchGenerate}
                disabled={isLoading}
                title="Generate multiple versions of the edit">
                {isBatchGenerating ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🔢</span>
                    <span>Batch</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <label className="temperature-control">
              Temp:
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                disabled={isLoading}
              />
              {temperature.toFixed(2)}
            </label>
          )}
          <button
            className={`send-button ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleSend}
            disabled={isLoading}>
            {isLoading && !isBatchGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}