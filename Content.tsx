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
import getStroke from 'perfect-freehand';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ResizePayload, useResizeDetector} from 'react-resize-detector';
import {
  ActiveColorAtom,
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  DrawModeAtom,
  FOVAtom,
  GeneratedImageSrcAtom,
  ImageSentAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  LinesAtom,
  PointsAtom,
  RevealOnHoverModeAtom,
  ShareStream,
  VideoRefAtom,
} from './atoms';
import {lineOptions, segmentationColorsRgb} from './consts';
import {useResetState} from './hooks';
import {getSvgPathFromStroke} from './utils';

export function Content() {
  const [imageSrc, setImageSrc] = useAtom(ImageSrcAtom);
  const [generatedImageSrc] = useAtom(GeneratedImageSrcAtom);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [boundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [boundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType, setDetectType] = useAtom(DetectTypeAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [fov] = useAtom(FOVAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [points] = useAtom(PointsAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [hoverEntered, setHoverEntered] = useState(false);
  const [hoveredBox, _setHoveredBox] = useState<number | null>(null);
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);
  const isImageEditing = detectType === 'Image Editing';
  const setIsUploadedImage = useSetAtom(IsUploadedImageAtom);
  const resetState = useResetState();
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(0.92);

  // Handling resize and aspect ratios
  const boundingBoxContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerDims, setContainerDims] = useState({
    width: 0,
    height: 0,
  });
  const [activeMediaDimensions, setActiveMediaDimensions] = useState({
    width: 1,
    height: 1,
  });

  const onResize = useCallback((el: ResizePayload) => {
    if (el.width && el.height) {
      setContainerDims({
        width: el.width,
        height: el.height,
      });
    }
  }, []);

  const {ref: containerRef} = useResizeDetector({onResize});

  const boundingBoxContainer = useMemo(() => {
    const {width, height} = activeMediaDimensions;
    const aspectRatio = width / height;
    const containerAspectRatio = containerDims.width / containerDims.height;
    if (aspectRatio < containerAspectRatio) {
      return {
        height: containerDims.height,
        width: containerDims.height * aspectRatio,
      };
    } else {
      return {
        width: containerDims.width,
        height: containerDims.width / aspectRatio,
      };
    }
  }, [containerDims, activeMediaDimensions]);

  // Helper functions
  function matrixMultiply(m: number[][], v: number[]): number[] {
    return m.map((row: number[]) =>
      row.reduce((sum, val, i) => sum + val * v[i], 0),
    );
  }

  const linesAndLabels3D = useMemo(() => {
    if (!boundingBoxContainer) {
      return null;
    }
    let allLines = [];
    let allLabels = [];
    for (const box of boundingBoxes3D) {
      const {center, size, rpy} = box;

      // Convert Euler angles to quaternion
      const [sr, sp, sy] = rpy.map((x) => Math.sin(x / 2));
      const [cr, cp, cz] = rpy.map((x) => Math.cos(x / 2));
      const quaternion = [
        sr * cp * cz - cr * sp * sy,
        cr * sp * cz + sr * cp * sy,
        cr * cp * sy - sr * sp * cz,
        cr * cp * cz + sr * sp * sy,
      ];

      // Calculate camera parameters
      const height = boundingBoxContainer.height;
      const width = boundingBoxContainer.width;
      const f = width / (2 * Math.tan(((fov / 2) * Math.PI) / 180));
      const cx = width / 2;
      const cy = height / 2;
      const intrinsics = [
        [f, 0, cx],
        [0, f, cy],
        [0, 0, 1],
      ];

      // Get box vertices
      const halfSize = size.map((s) => s / 2);
      let corners = [];
      for (let x of [-halfSize[0], halfSize[0]]) {
        for (let y of [-halfSize[1], halfSize[1]]) {
          for (let z of [-halfSize[2], halfSize[2]]) {
            corners.push([x, y, z]);
          }
        }
      }
      corners = [
        corners[1],
        corners[3],
        corners[7],
        corners[5],
        corners[0],
        corners[2],
        corners[6],
        corners[4],
      ];

      // Apply rotation from quaternion
      const q = quaternion;
      const rotationMatrix = [
        [
          1 - 2 * q[1] ** 2 - 2 * q[2] ** 2,
          2 * q[0] * q[1] - 2 * q[3] * q[2],
          2 * q[0] * q[2] + 2 * q[3] * q[1],
        ],
        [
          2 * q[0] * q[1] + 2 * q[3] * q[2],
          1 - 2 * q[0] ** 2 - 2 * q[2] ** 2,
          2 * q[1] * q[2] - 2 * q[3] * q[0],
        ],
        [
          2 * q[0] * q[2] - 2 * q[3] * q[1],
          2 * q[1] * q[2] + 2 * q[3] * q[0],
          1 - 2 * q[0] ** 2 - 2 * q[1] ** 2,
        ],
      ];

      const boxVertices = corners.map((corner) => {
        const rotated = matrixMultiply(rotationMatrix, corner);
        return rotated.map((val, idx) => val + center[idx]);
      });

      // Project 3D points to 2D
      const tiltAngle = 90.0;
      const viewRotationMatrix = [
        [1, 0, 0],
        [
          0,
          Math.cos((tiltAngle * Math.PI) / 180),
          -Math.sin((tiltAngle * Math.PI) / 180),
        ],
        [
          0,
          Math.sin((tiltAngle * Math.PI) / 180),
          Math.cos((tiltAngle * Math.PI) / 180),
        ],
      ];

      const points = boxVertices;
      const rotatedPoints = points.map((p) =>
        matrixMultiply(viewRotationMatrix, p),
      );
      const translatedPoints = rotatedPoints.map((p) => p.map((v) => v + 0));
      const projectedPoints = translatedPoints.map((p) =>
        matrixMultiply(intrinsics, p),
      );
      const vertices = projectedPoints.map((p) => [p[0] / p[2], p[1] / p[2]]);

      const topVertices = vertices.slice(0, 4);
      const bottomVertices = vertices.slice(4, 8);

      for (let i = 0; i < 4; i++) {
        const lines = [
          [topVertices[i], topVertices[(i + 1) % 4]],
          [bottomVertices[i], bottomVertices[(i + 1) % 4]],
          [topVertices[i], bottomVertices[i]],
        ];

        for (let [start, end] of lines) {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          allLines.push({start, end, length, angle});
        }
      }

      // Add label with fade effect
      const textPosition3d = points[0].map(
        (_, idx) => points.reduce((sum, p) => sum + p[idx], 0) / points.length,
      );
      textPosition3d[2] += 0.1;

      const textPoint = matrixMultiply(
        intrinsics,
        matrixMultiply(
          viewRotationMatrix,
          textPosition3d.map((v) => v + 0),
        ),
      );
      const textPos = [
        textPoint[0] / textPoint[2],
        textPoint[1] / textPoint[2],
      ];
      allLabels.push({label: box.label, pos: textPos});
    }
    return [allLines, allLabels] as const;
  }, [boundingBoxes3D, boundingBoxContainer, fov]);

  function setHoveredBox(e: React.PointerEvent) {
    const boxes = document.querySelectorAll('.bbox');
    const dimensionsAndIndex = Array.from(boxes).map((box, i) => {
      const {top, left, width, height} = box.getBoundingClientRect();
      return {
        top,
        left,
        width,
        height,
        index: i,
      };
    });
    // Sort smallest to largest
    const sorted = dimensionsAndIndex.sort(
      (a, b) => a.width * a.height - b.width * b.height,
    );
    // Find the smallest box that contains the mouse
    const {clientX, clientY} = e;
    const found = sorted.find(({top, left, width, height}) => {
      return (
        clientX > left &&
        clientX < left + width &&
        clientY > top &&
        clientY < top + height
      );
    });
    if (found) {
      _setHoveredBox(found.index);
    } else {
      _setHoveredBox(null);
    }
  }

  function downloadImage() {
    if (!generatedImageSrc) return;

    if (exportFormat === 'png') {
      // The source is already a PNG data URL, so we can download it directly.
      const a = document.createElement('a');
      a.href = generatedImageSrc;
      a.download = 'edited-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (exportFormat === 'jpeg') {
      // For JPEG, we need to draw the image to a canvas and convert it.
      const image = new Image();
      image.src = generatedImageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // In case the PNG has transparency, draw a white background first.
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);

          const jpegDataUrl = canvas.toDataURL('image/jpeg', exportQuality);

          const a = document.createElement('a');
          a.href = jpegDataUrl;
          a.download = 'edited-image.jpeg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
    }
  }

  function handleUseForDetection() {
    if (!generatedImageSrc) return;
    const currentGeneratedImage = generatedImageSrc;
    resetState();
    setImageSrc(currentGeneratedImage);
    setIsUploadedImage(true);
    setDetectType('2D bounding boxes');
  }

  const downRef = useRef<Boolean>(false);

  if (isImageEditing) {
    return (
      <div className="w-full grow flex flex-col md:flex-row p-2 md:p-4 gap-4">
        <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
          <div className="text-sm uppercase text-[var(--text-color-secondary)]">
            Original
          </div>
          <div className="relative w-full h-full border border-[var(--border-color)] rounded-lg overflow-hidden">
            {stream ? (
              <video
                className="absolute top-0 left-0 w-full h-full object-contain"
                autoPlay
                ref={(video) => {
                  videoRef.current = video;
                  if (video && !video.srcObject) {
                    video.srcObject = stream;
                  }
                }}
              />
            ) : imageSrc ? (
              <img
                src={imageSrc}
                className="absolute top-0 left-0 w-full h-full object-contain"
                alt="Original image"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-color-secondary)] p-4 text-center">
                Upload an image or start screenshare.
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
          <div className="text-sm uppercase text-[var(--text-color-secondary)]">
            Edited
          </div>
          <div className="relative w-full h-full border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--input-color)]">
            {generatedImageSrc ? (
              <>
                <img
                  src={generatedImageSrc}
                  className="absolute top-0 left-0 w-full h-full object-contain"
                  alt="Edited image"
                />
                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-black/80 p-2 rounded-lg text-sm text-[var(--text-color-primary)] backdrop-blur-sm">
                    {/* Left side: Export Options */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="font-bold whitespace-nowrap">
                          Format:
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="png"
                            checked={exportFormat === 'png'}
                            onChange={() => setExportFormat('png')}
                          />{' '}
                          PNG
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="jpeg"
                            checked={exportFormat === 'jpeg'}
                            onChange={() => setExportFormat('jpeg')}
                          />{' '}
                          JPEG
                        </label>
                      </div>
                      {exportFormat === 'jpeg' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <label className="whitespace-nowrap">
                            Quality:
                          </label>
                          <input
                            type="range"
                            className="w-full"
                            min="0.1"
                            max="1"
                            step="0.01"
                            value={exportQuality}
                            onChange={(e) =>
                              setExportQuality(Number(e.target.value))
                            }
                          />
                          <span>{exportQuality.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {/* Right side: Action Buttons */}
                    <div className="flex gap-2 w-full lg:w-auto justify-end">
                      <button
                        onClick={handleUseForDetection}
                        className="secondary flex grow lg:grow-0 items-center gap-2 justify-center"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          color: '#000',
                        }}>
                        <span aria-hidden="true">🎯</span>
                        <span className="hidden sm:inline">
                          Use for Detection
                        </span>
                      </button>
                      <button
                        onClick={downloadImage}
                        className="secondary flex grow lg:grow-0 items-center gap-2 justify-center"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          color: '#000',
                        }}>
                        <span aria-hidden="true">⬇️</span>
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-color-secondary)] p-4 text-center">
                Your edited image will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full grow relative">
      {stream ? (
        <video
          className="absolute top-0 left-0 w-full h-full object-contain"
          autoPlay
          onLoadedMetadata={(e) => {
            setActiveMediaDimensions({
              width: e.currentTarget.videoWidth,
              height: e.currentTarget.videoHeight,
            });
          }}
          ref={(video) => {
            videoRef.current = video;
            if (video && !video.srcObject) {
              video.srcObject = stream;
            }
          }}
        />
      ) : imageSrc ? (
        <img
          src={imageSrc}
          className="absolute top-0 left-0 w-full h-full object-contain"
          alt="Uploaded image"
          onLoad={(e) => {
            setActiveMediaDimensions({
              width: e.currentTarget.naturalWidth,
              height: e.currentTarget.naturalHeight,
            });
          }}
        />
      ) : null}
      <div
        className={`absolute w-full h-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${hoverEntered ? 'hide-box' : ''} ${drawMode ? 'cursor-crosshair' : ''}`}
        ref={boundingBoxContainerRef}
        onPointerEnter={(e) => {
          if (revealOnHover && !drawMode) {
            setHoverEntered(true);
            setHoveredBox(e);
          }
        }}
        onPointerMove={(e) => {
          if (revealOnHover && !drawMode) {
            setHoverEntered(true);
            setHoveredBox(e);
          }
          if (downRef.current) {
            const parentBounds =
              boundingBoxContainerRef.current!.getBoundingClientRect();
            setLines((prev) => [
              ...prev.slice(0, prev.length - 1),
              [
                [
                  ...prev[prev.length - 1][0],
                  [
                    (e.clientX - parentBounds.left) /
                      boundingBoxContainer!.width,
                    (e.clientY - parentBounds.top) /
                      boundingBoxContainer!.height,
                  ],
                ],
                prev[prev.length - 1][1],
              ],
            ]);
          }
        }}
        onPointerLeave={(e) => {
          if (revealOnHover && !drawMode) {
            setHoverEntered(false);
            setHoveredBox(e);
          }
        }}
        onPointerDown={(e) => {
          if (drawMode) {
            setImageSent(false);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            downRef.current = true;
            const parentBounds =
              boundingBoxContainerRef.current!.getBoundingClientRect();
            setLines((prev) => [
              ...prev,
              [
                [
                  [
                    (e.clientX - parentBounds.left) /
                      boundingBoxContainer!.width,
                    (e.clientY - parentBounds.top) /
                      boundingBoxContainer!.height,
                  ],
                ],
                activeColor,
              ],
            ]);
          }
        }}
        onPointerUp={(e) => {
          if (drawMode) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            downRef.current = false;
          }
        }}
        style={{
          width: boundingBoxContainer.width,
          height: boundingBoxContainer.height,
        }}>
        {lines.length > 0 && (
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{
              pointerEvents: 'none',
              width: boundingBoxContainer?.width,
              height: boundingBoxContainer?.height,
            }}>
            {lines.map(([points, color], i) => (
              <path
                key={i}
                d={getSvgPathFromStroke(
                  getStroke(
                    points.map(([x, y]) => [
                      x * boundingBoxContainer!.width,
                      y * boundingBoxContainer!.height,
                      0.5,
                    ]),
                    lineOptions,
                  ),
                )}
                fill={color}
              />
            ))}
          </svg>
        )}
        {detectType === '2D bounding boxes' &&
          boundingBoxes2D.map((box, i) => (
            <div
              key={i}
              className={`absolute bbox border-2 border-[#3B68FF] ${i === hoveredBox ? 'reveal' : ''}`}
              style={{
                transformOrigin: '0 0',
                top: box.y * 100 + '%',
                left: box.x * 100 + '%',
                width: box.width * 100 + '%',
                height: box.height * 100 + '%',
              }}>
              <div className="bg-[#3B68FF] text-white absolute left-0 top-0 text-sm px-1">
                {box.label}
              </div>
            </div>
          ))}
        {detectType === 'Segmentation masks' &&
          boundingBoxMasks.map((box, i) => (
            <div
              key={i}
              className={`absolute bbox border-2 border-[#3B68FF] ${i === hoveredBox ? 'reveal' : ''}`}
              style={{
                transformOrigin: '0 0',
                top: box.y * 100 + '%',
                left: box.x * 100 + '%',
                width: box.width * 100 + '%',
                height: box.height * 100 + '%',
              }}>
              <BoxMask box={box} index={i} />
              <div className="w-full top-0 h-0 absolute">
                <div className="bg-[#3B68FF] text-white absolute -left-[2px] bottom-0 text-sm px-1">
                  {box.label}
                </div>
              </div>
            </div>
          ))}

        {detectType === 'Points' &&
          points.map((point, i) => {
            return (
              <div
                key={i}
                className="absolute bg-red"
                style={{
                  left: `${point.point.x * 100}%`,
                  top: `${point.point.y * 100}%`,
                }}>
                <div className="absolute bg-[#3B68FF] text-center text-white text-xs px-1 bottom-4 rounded-sm -translate-x-1/2 left-1/2">
                  {point.label}
                </div>
                <div className="absolute w-4 h-4 bg-[#3B68FF] rounded-full border-white border-[2px] -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            );
          })}
        {detectType === '3D bounding boxes' && linesAndLabels3D ? (
          <>
            {linesAndLabels3D[0].map((line, i) => (
              <div
                key={i}
                className="absolute h-[2px] bg-[#3B68FF]"
                style={{
                  width: `${line.length}px`,
                  transform: `translate(${line.start[0]}px, ${line.start[1]}px) rotate(${line.angle}rad)`,
                  transformOrigin: '0 0',
                }}></div>
            ))}
            {linesAndLabels3D[1].map((label, i) => (
              <div
                key={i}
                className="absolute bg-[#3B68FF] text-white text-xs px-1"
                style={{
                  top: `${label.pos[1]}px`,
                  left: `${label.pos[0]}px`,
                  transform: 'translate(-50%, -50%)',
                }}>
                {label.label}
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

function BoxMask({
  box,
  index,
}: {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    imageData: string;
  };
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rgb = segmentationColorsRgb[index % segmentationColorsRgb.length];

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const image = new Image();
        image.src = box.imageData;
        image.onload = () => {
          canvasRef.current!.width = image.width;
          canvasRef.current!.height = image.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, image.width, image.height);
          const data = pixels.data;
          for (let i = 0; i < data.length; i += 4) {
            // alpha from mask
            data[i + 3] = data[i];
            // color from palette
            data[i] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
          }
          ctx.putImageData(pixels, 0, 0);
        };
      }
    }
  }, [canvasRef, box.imageData, rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{opacity: 0.5}}
    />
  );
}
