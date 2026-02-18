
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import {useRef} from 'react';
import type {PointerEvent, RefObject} from 'react';
import {
  BrushOpacityAtom,
  BrushShapeAtom,
  BrushSizeAtom,
  BumpSessionAtom,
  GalleryImagesAtom,
  GeneratedImageSrcAtom,
  GeneratedImageKeyAtom,
  SecondaryGeneratedImageSrcAtom,
  SecondaryGeneratedImageKeyAtom,
  SecondaryQualityMetadataAtom,
  HistoryAtom,
  ImageSentAtom,
  IsDrawingROIAtom,
  PointsAtom,
  ROIActiveShapeAtom,
  ROIAtom,
  ROICursorPosAtom,
  ROISelectedIdAtom,
} from './atoms';
import {
  addGalleryImage,
  addGalleryMetadata,
  addHistoryImage,
  addHistoryResult,
  clearGalleryForProject,
  clearGalleryMetadataForProject,
  deleteGalleryImage,
  deleteGalleryMetadata,
  deleteHistoryImage,
  deleteHistoryResult,
} from './db';
// Added ROI to imports from Types to fix 'Cannot find name ROI' error.
import {GalleryImageMetadata, HistoryItem, HistoryResult, ROIPolygon, ROIShape, ROIBrush, ROICircle, ROIRectangle, ROIFreehand, ROI} from './Types';
import {dataURLtoBlob} from './utils';

export function useResetState() {
  const setImageSent = useSetAtom(ImageSentAtom);
  const setBumpSession = useSetAtom(BumpSessionAtom);
  const setGeneratedImageSrc = useSetAtom(GeneratedImageSrcAtom);
  const setGeneratedImageKey = useSetAtom(GeneratedImageKeyAtom);
  const setSecondaryGeneratedImageSrc = useSetAtom(SecondaryGeneratedImageSrcAtom);
  const setSecondaryGeneratedImageKey = useSetAtom(SecondaryGeneratedImageKeyAtom);
  const setSecondaryQualityMetadata = useSetAtom(SecondaryQualityMetadataAtom);
  const setRoi = useSetAtom(ROIAtom);
  const setIsDrawingRoi = useSetAtom(IsDrawingROIAtom);
  const setROIActiveShape = useSetAtom(ROIActiveShapeAtom);
  const setROICursorPos = useSetAtom(ROICursorPosAtom);
  const setROISelectedId = useSetAtom(ROISelectedIdAtom);

  return () => {
    setImageSent(false);
    setBumpSession((prev) => prev + 1);
    setGeneratedImageSrc(null);
    setGeneratedImageKey(null);
    setSecondaryGeneratedImageSrc(null);
    setSecondaryGeneratedImageKey(null);
    setSecondaryQualityMetadata(null);
    setRoi([]);
    setIsDrawingRoi(false);
    setROIActiveShape(null);
    setROICursorPos(null);
    setROISelectedId(null);
  };
}

export function useManageHistory() {
  const setHistory = useSetAtom(HistoryAtom);

  const addHistoryItem = async (itemArgs: any) => {
    const id = Date.now();
    const { imageSrc, thumbnail, resultThumbnail, result, ...metadata } = itemArgs;

    const imageBlob = dataURLtoBlob(imageSrc);
    await addHistoryImage(id, imageBlob);

    const thumbId = id + 1;
    const thumbBlob = dataURLtoBlob(thumbnail);
    await addHistoryImage(thumbId, thumbBlob);

    const newItem: HistoryItem = {
      ...metadata,
      id: id,
      timestamp: id,
      imageSrc: id,
      thumbnail: thumbId,
    };

    if (resultThumbnail) {
      const resultThumbId = id + 2;
      const resultThumbBlob = dataURLtoBlob(resultThumbnail);
      await addHistoryImage(resultThumbId, resultThumbBlob);
      newItem.resultThumbnail = resultThumbId;
    }

    if (result) {
      await addHistoryResult(id, result);
    }

    const historyKey = `history-${newItem.projectId}`;
    const storedHistory = localStorage.getItem(historyKey);
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];

    const updatedHistory = [newItem, ...currentHistory].slice(0, 30);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  const clearHistory = async (projectId: number) => {
    const historyKey = `history-${projectId}`;
    localStorage.removeItem(historyKey);
    setHistory([]);
  };

  return {addHistoryItem, clearHistory};
}

export function useManageGallery() {
  const setGalleryKeys = useSetAtom(GalleryImagesAtom);

  const addGalleryItem = async (
    imageDataUrl: string,
    projectId: number,
    metadata?: GalleryImageMetadata,
    originalDataUrl?: string,
  ): Promise<number> => {
    const key = Date.now();
    const blob = dataURLtoBlob(imageDataUrl);
    
    let originalBlob: Blob | undefined;
    if (originalDataUrl) {
      originalBlob = dataURLtoBlob(originalDataUrl);
    }

    await addGalleryImage(key, blob, projectId, originalBlob);
    if (metadata) await addGalleryMetadata(key, metadata);

    setGalleryKeys((prev) => [key, ...prev].slice(0, 50));
    return key;
  };

  const deleteGalleryItems = async (keysToDelete: number[]) => {
    for (const key of keysToDelete) {
      await deleteGalleryImage(key);
      await deleteGalleryMetadata(key);
    }
    setGalleryKeys((prev) => prev.filter((key) => !keysToDelete.includes(key)));
  };

  const clearGallery = async (projectId: number) => {
    await clearGalleryForProject(projectId);
    await clearGalleryMetadataForProject(projectId);
    setGalleryKeys([]);
  };

  return {addGalleryItem, clearGallery, deleteGalleryItems};
}

export function useROIDrawing(
  drawingContainerRef: RefObject<HTMLDivElement | null>,
  scaledDims: {width: number; height: number},
) {
  const [rois, setRois] = useAtom(ROIAtom);
  const [isDrawing, setIsDrawing] = useAtom(IsDrawingROIAtom);
  const [activeTool] = useAtom(ROIActiveShapeAtom);
  const [selectedId, setSelectedId] = useAtom(ROISelectedIdAtom);
  const [brushSize] = useAtom(BrushSizeAtom);
  const [brushOpacity] = useAtom(BrushOpacityAtom);
  const [brushShape] = useAtom(BrushShapeAtom);
  const setROICursorPos = useSetAtom(ROICursorPosAtom);

  const activeId = useRef<string | null>(null);
  const startPoint = useRef<{x: number; y: number} | null>(null);

  const getPos = (e: PointerEvent) => {
    if (!drawingContainerRef.current) return null;
    const rect = drawingContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x, y };
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!activeTool || activeTool === 'pan') return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getPos(e);
    if (!pos) return;

    if (activeTool === 'select') {
      const found = [...rois].reverse().find(roi => {
        if (roi.type === 'rectangle') return pos.x >= roi.x && pos.x <= roi.x + roi.width && pos.y >= roi.y && pos.y <= roi.y + roi.height;
        if (roi.type === 'circle') {
          const dist = Math.sqrt(Math.pow(pos.x - roi.x, 2) + Math.pow(pos.y - roi.y, 2));
          return dist <= roi.radius;
        }
        return false;
      });
      setSelectedId(found ? found.id : null);
      return;
    }

    setIsDrawing(true);
    const id = Date.now().toString();
    activeId.current = id;
    startPoint.current = pos;

    const common = { id, isSelected: true };
    
    let newShape: ROIShape;
    switch(activeTool) {
      case 'rectangle':
        newShape = { ...common, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0 } as ROIRectangle;
        break;
      case 'circle':
        newShape = { ...common, type: 'circle', x: pos.x, y: pos.y, radius: 0 } as ROICircle;
        break;
      case 'brush':
        newShape = { ...common, type: 'brush', points: [pos], strokeWidth: brushSize / scaledDims.width, opacity: brushOpacity, brushShape } as ROIBrush;
        break;
      case 'freehand':
        newShape = { ...common, type: 'freehand', points: [pos] } as ROIFreehand;
        break;
      case 'polygon':
        newShape = { ...common, type: 'polygon', points: [pos], isFinished: false } as ROIPolygon;
        break;
      default: return;
    }
    
    setRois(prev => [...prev, newShape]);
    setSelectedId(id);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const pos = getPos(e);
    if (!pos) return;
    setROICursorPos(pos);
    
    if (!isDrawing || !activeId.current || !startPoint.current) return;

    setRois(prev => prev.map(roi => {
      if (roi.id !== activeId.current) return roi;
      
      switch(roi.type) {
        case 'rectangle':
          return {
            ...roi,
            x: Math.min(pos.x, startPoint.current!.x),
            y: Math.min(pos.y, startPoint.current!.y),
            width: Math.abs(pos.x - startPoint.current!.x),
            height: Math.abs(pos.y - startPoint.current!.y)
          };
        case 'circle':
          const radius = Math.sqrt(Math.pow(pos.x - startPoint.current!.x, 2) + Math.pow(pos.y - startPoint.current!.y, 2));
          return { ...roi, radius };
        case 'brush':
        case 'freehand':
        case 'polygon':
          return { ...roi, points: [...roi.points, pos] };
        default: return roi;
      }
    }) as ROI);
  };

  const handlePointerUp = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    activeId.current = null;
    startPoint.current = null;
  };

  const handlePointerLeave = () => setROICursorPos(null);

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave };
}
