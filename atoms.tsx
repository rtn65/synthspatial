
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {atom} from 'jotai';
import {colors} from './consts';
import {
  DetectTypes,
  GalleryImageMetadata,
  HistoryItem,
  Project,
  ROI,
  Theme,
} from './Types';

export const ImageSrcAtom = atom(null as string | null);
export const ImageSentAtom = atom(false);
export const RevealOnHoverModeAtom = atom(false);
export const TemperatureAtom = atom(0.7);
export const ShareStream = atom(null as MediaStream | null);
export const DetectTypeAtom = atom('Synthetic Generation' as DetectTypes);
export const ActiveColorAtom = atom(colors[6]);
export const VideoRefAtom = atom<{current: HTMLVideoElement | null}>({
  current: null,
});
export const InitFinishedAtom = atom(true);
export const BumpSessionAtom = atom(0);
export const IsUploadedImageAtom = atom(false);
export const IsLoadingAtom = atom(false);
export const IsStoppingAtom = atom(false);

// Primary Generation Atoms
export const GeneratedImageSrcAtom = atom(null as string | null);
export const GeneratedImageKeyAtom = atom(null as number | null);
export const CurrentQualityMetadataAtom = atom(null as GalleryImageMetadata | null);

// Secondary Generation Atoms (Dual Mode)
export const IsDualModelModeAtom = atom(false);
export const SecondarySynthesisModelAtom = atom('gemini-3-pro-image-preview' as SynthesisModel);
export const SecondaryGeneratedImageSrcAtom = atom(null as string | null);
export const SecondaryGeneratedImageKeyAtom = atom(null as number | null);
export const SecondaryQualityMetadataAtom = atom(null as GalleryImageMetadata | null);

// Batch and Presets
export const BatchCountAtom = atom(1);
export const SelectedBackgroundPresetAtom = atom(null as string | null);
export const IsChainedModeAtom = atom(false);
export const IsBackgroundReplacementModeAtom = atom(false); 
export const CurrentBatchProgressAtom = atom(0);
export const MinQualityThresholdAtom = atom(0); 

// Camera & Perspective
export type CameraAngle = 'default' | 'wide' | 'top-down' | 'low-angle' | 'close-up' | 'cinematic';
export const CameraAngleAtom = atom('default' as CameraAngle);
export type PerspectiveStyle = 'standard' | 'isometric' | 'fisheye' | 'panoramic' | 'macro' | 'orthographic';
export const PerspectiveStyleAtom = atom('standard' as PerspectiveStyle);

// Sector / Industry Selection
export type SectorType = 'general' | 'agriculture' | 'manufacturing' | 'security' | 'remote_sensing' | 'red_team' | 'data_dreamer' | 'external_api';
export const ActiveSectorAtom = atom('general' as SectorType);

// Advanced AI Features
export const IsSearchGroundingActiveAtom = atom(false);
export const IsLiveAssistantActiveAtom = atom(false);
export const LiveTranscriptAtom = atom('');
export const IsVideoLoadingAtom = atom(false);
export const IsUpscalingAtom = atom(false);
export const UpscaleSizeAtom = atom('2K' as '2K' | '4K');
export const GeneratedVideoUrlAtom = atom(null as string | null);

// Panel Visibility
export const IsInputPanelOpenAtom = atom(true);
export const IsGuideOpenAtom = atom(false);

// Model Selection Atoms
export type SynthesisModel = 
  | 'gemini-2.5-flash-image' 
  | 'gemini-3-pro-image-preview' 
  | 'imagen-4.0-generate-001' 
  | 'veo-3.1-fast-generate-preview'
  | 'runway-gen3'
  | 'fal-flux-pro'
  | 'fal-flux-lora';

export const SynthesisModelAtom = atom('gemini-2.5-flash-image' as SynthesisModel);
export const ImageSizeAtom = atom('1K' as '1K' | '2K' | '4K');

// Fal.ai specific atoms
export const FalLoRAScaleAtom = atom(0.8);
export const FalNumStepsAtom = atom(28);
export const FalGuidanceScaleAtom = atom(3.5);

// Prompt Atom
export const EditPromptAtom = atom('Bulutların üzerinde, gün batımında fütüristik bir şehir; uçan araçlar, neon ışıkları, ultra detaylı ve sinematik atmosfer.');

// Theme Atom
export const ThemeAtom = atom('system' as Theme);

// Project Atoms
export const ProjectsAtom = atom([] as Project[]);
export const ActiveProjectIdAtom = atom(null as number | null);

// History Atoms
export const IsHistoryPanelOpenAtom = atom(false);
export const HistoryAtom = atom([] as HistoryItem[]);
export const ActiveProjectHistoryAtom = atom<HistoryItem[]>((get) => {
  const allHistory = get(HistoryAtom);
  const activeId = get(ActiveProjectIdAtom);
  if (!activeId) return [];
  return allHistory.filter((item) => item.projectId === activeId);
});

export const HistoryItemToLoadAtom = atom(null as HistoryItem | null);

// Gallery Atoms
export const IsGalleryPanelOpenAtom = atom(false);
export const GalleryImagesAtom = atom([] as number[]);
export const ActiveProjectGalleryImagesAtom = atom((get) => get(GalleryImagesAtom));

// Error Atom
export const ErrorAtom = atom(null as string | null);

// Tutorial Atoms
export const IsTutorialActiveAtom = atom(false);
export const TutorialStepAtom = atom(0);

// Region of Interest (ROI) Atoms
export const ROIAtom = atom([] as ROI);
export const IsDrawingROIAtom = atom(false);
export type ROIActiveTool = 'rectangle' | 'polygon' | 'circle' | 'freehand' | 'brush' | 'select' | 'pan' | null;
export const ROIActiveShapeAtom = atom(null as ROIActiveTool);
export const ROICursorPosAtom = atom(null as {x: number; y: number} | null);
export const ROISelectedIdAtom = atom(null as string | null);

// Brush Settings Atoms
export const BrushSizeAtom = atom(40);
export const BrushOpacityAtom = atom(0.6);
export const BrushShapeAtom = atom<'round' | 'square'>('round');

// Auto-Labeling Atom
export const AutoLabelAtom = atom(false);

/**
 * Missing Atoms required by various panels and controls.
 */
export const BoundingBoxes2DAtom = atom([] as any[]);
export const BoundingBoxes3DAtom = atom([] as any[]);
export const BoundingBoxMasksAtom = atom([] as any[]);
export const PointsAtom = atom([] as any[]);
export const DrawModeAtom = atom(false);
export const FOVAtom = atom(75);
export const HoveredBoxAtom = atom(null as any);
export const LinesAtom = atom([] as any[]);
export const IsDatasetPanelOpenAtom = atom(false);
export const ZoomLevelAtom = atom(1);
export const PanOffsetAtom = atom({x: 0, y: 0});
export const IsMaskVisibleAtom = atom(true);
