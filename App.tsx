
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import {useEffect, useRef} from 'react';
import {Content} from './Content';
import {ErrorToast} from './ErrorToast';
import {ExtraModeControls} from './ExtraModeControls';
import {GalleryPanel} from './GalleryPanel';
import {HistoryPanel} from './HistoryPanel';
import {InputPanel} from './InputPanel';
import {TopBar} from './TopBar';
import {Tutorial} from './Tutorial';
import {EngineeringGuide} from './EngineeringGuide';
import {DetectTypes, Project, Theme} from './Types';
import {
  ActiveProjectIdAtom,
  BatchCountAtom,
  BrushOpacityAtom,
  BrushShapeAtom,
  BrushSizeAtom,
  CameraAngleAtom,
  DetectTypeAtom,
  EditPromptAtom,
  GalleryImagesAtom,
  HistoryAtom,
  HistoryItemToLoadAtom,
  ImageSizeAtom,
  ImageSrcAtom,
  InitFinishedAtom,
  IsBackgroundReplacementModeAtom,
  IsChainedModeAtom,
  IsUploadedImageAtom,
  IsTutorialActiveAtom,
  MinQualityThresholdAtom,
  ProjectsAtom,
  SynthesisModelAtom,
  ThemeAtom,
  IsInputPanelOpenAtom,
} from './atoms';
import {imageOptions} from './consts';
import {getAllGalleryImagesForProject, getHistoryImage} from './db';
import {useResetState} from './hooks';
import {hash} from './utils';

const THEME_KEY = 'theme';
const PROJECTS_KEY = 'projects';
const ACTIVE_PROJECT_ID_KEY = 'activeProjectId';
const TUTORIAL_SEEN_KEY = 'tutorialSeen';
const BRUSH_SIZE_KEY = 'brushSize';
const BRUSH_OPACITY_KEY = 'brushOpacity';
const BRUSH_SHAPE_KEY = 'brushShape';

const SYNTH_MODEL_BASE_KEY = 'synthModel';
const IMAGE_SIZE_BASE_KEY = 'imageSize';
const EDIT_PROMPT_BASE_KEY = 'editPrompt';
const BATCH_COUNT_BASE_KEY = 'batchCount';
const CHAINED_MODE_BASE_KEY = 'isChainedMode';
const BG_REPLACE_MODE_BASE_KEY = 'isBgReplaceMode';
const MIN_QUALITY_BASE_KEY = 'minQuality';
const CAMERA_ANGLE_BASE_KEY = 'cameraAngle';

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
  const [projects, setProjects] = useAtom(ProjectsAtom);
  const [activeProjectId, setActiveProjectId] = useAtom(ActiveProjectIdAtom);
  const setIsTutorialActive = useSetAtom(IsTutorialActiveAtom);
  const [isInputPanelOpen] = useAtom(IsInputPanelOpenAtom);
  
  const [brushSize, setBrushSize] = useAtom(BrushSizeAtom);
  const [brushOpacity, setBrushOpacity] = useAtom(BrushOpacityAtom);
  const [brushShape, setBrushShape] = useAtom(BrushShapeAtom);
  const [synthModel, setSynthModel] = useAtom(SynthesisModelAtom);
  const [imageSize, setImageSize] = useAtom(ImageSizeAtom);
  const [batchCount, setBatchCount] = useAtom(BatchCountAtom);
  const [isChainedMode, setIsChainedMode] = useAtom(IsChainedModeAtom);
  const [isBgReplaceMode, setIsBgReplaceMode] = useAtom(IsBackgroundReplacementModeAtom);
  const [minQuality, setMinQuality] = useAtom(MinQualityThresholdAtom);
  const [cameraAngle, setCameraAngle] = useAtom(CameraAngleAtom);
  const [editPrompt, setEditPrompt] = useAtom(EditPromptAtom);

  const previousObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem(PROJECTS_KEY);
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        setProjects(parsedProjects);
        const storedActiveId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
        const activeId = storedActiveId ? parseInt(storedActiveId, 10) : parsedProjects[0]?.id;
        if (activeId && parsedProjects.some((p: Project) => p.id === activeId)) {
          setActiveProjectId(activeId);
        } else if (parsedProjects.length > 0) {
          setActiveProjectId(parsedProjects[0].id);
        }
      } else {
        const defaultProject = {id: Date.now(), name: 'Yeni Proje'};
        setProjects([defaultProject]);
        setActiveProjectId(defaultProject.id);
        if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
          setIsTutorialActive(true);
        }
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
  }, [setProjects, setActiveProjectId, setIsTutorialActive]);

  useEffect(() => {
    const storedSize = localStorage.getItem(BRUSH_SIZE_KEY);
    if (storedSize) setBrushSize(parseInt(storedSize, 10));
    const storedOpacity = localStorage.getItem(BRUSH_OPACITY_KEY);
    if (storedOpacity) setBrushOpacity(parseFloat(storedOpacity));
    const storedShape = localStorage.getItem(BRUSH_SHAPE_KEY);
    if (storedShape === 'round' || storedShape === 'square') {
      setBrushShape(storedShape);
    }
  }, [setBrushSize, setBrushOpacity, setBrushShape]);

  useEffect(() => { localStorage.setItem(BRUSH_SIZE_KEY, String(brushSize)); }, [brushSize]);
  useEffect(() => { localStorage.setItem(BRUSH_OPACITY_KEY, String(brushOpacity)); }, [brushOpacity]);
  useEffect(() => { localStorage.setItem(BRUSH_SHAPE_KEY, brushShape); }, [brushShape]);

  useEffect(() => {
    if (projects.length > 0) localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (activeProjectId) localStorage.setItem(ACTIVE_PROJECT_ID_KEY, String(activeProjectId));
  }, [projects, activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;
    localStorage.setItem(`${SYNTH_MODEL_BASE_KEY}-${activeProjectId}`, synthModel);
    localStorage.setItem(`${IMAGE_SIZE_BASE_KEY}-${activeProjectId}`, imageSize);
    localStorage.setItem(`${BATCH_COUNT_BASE_KEY}-${activeProjectId}`, String(batchCount));
    localStorage.setItem(`${CHAINED_MODE_BASE_KEY}-${activeProjectId}`, String(isChainedMode));
    localStorage.setItem(`${BG_REPLACE_MODE_BASE_KEY}-${activeProjectId}`, String(isBgReplaceMode));
    localStorage.setItem(`${MIN_QUALITY_BASE_KEY}-${activeProjectId}`, String(minQuality));
    localStorage.setItem(`${CAMERA_ANGLE_BASE_KEY}-${activeProjectId}`, cameraAngle);
    const timer = setTimeout(() => {
      localStorage.setItem(`${EDIT_PROMPT_BASE_KEY}-${activeProjectId}`, editPrompt);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeProjectId, synthModel, imageSize, batchCount, isChainedMode, isBgReplaceMode, minQuality, cameraAngle, editPrompt]);

  useEffect(() => {
    if (!activeProjectId) return;
    try {
      const storedHistory = localStorage.getItem(`history-${activeProjectId}`);
      setHistory(storedHistory ? JSON.parse(storedHistory) : []);
    } catch (e) {
      console.error('Failed to load project history', e);
      setHistory([]);
    }
    getAllGalleryImagesForProject(activeProjectId)
      .then((images) => {
        setGalleryImageKeys(images.map((img) => img.key).sort((a, b) => b - a));
      })
      .catch((e) => console.error('Failed to load project gallery', e));

    const pModel = localStorage.getItem(`${SYNTH_MODEL_BASE_KEY}-${activeProjectId}`);
    if (pModel) setSynthModel(pModel as any);
    const pSize = localStorage.getItem(`${IMAGE_SIZE_BASE_KEY}-${activeProjectId}`);
    if (pSize) setImageSize(pSize as any);
    const pPrompt = localStorage.getItem(`${EDIT_PROMPT_BASE_KEY}-${activeProjectId}`);
    if (pPrompt) setEditPrompt(pPrompt);
    const pBatch = localStorage.getItem(`${BATCH_COUNT_BASE_KEY}-${activeProjectId}`);
    if (pBatch) setBatchCount(parseInt(pBatch, 10));
    const pChained = localStorage.getItem(`${CHAINED_MODE_BASE_KEY}-${activeProjectId}`);
    if (pChained) setIsChainedMode(pChained === 'true');
    const pBg = localStorage.getItem(`${BG_REPLACE_MODE_BASE_KEY}-${activeProjectId}`);
    if (pBg) setIsBgReplaceMode(pBg === 'true');
    const pMinQ = localStorage.getItem(`${MIN_QUALITY_BASE_KEY}-${activeProjectId}`);
    if (pMinQ) setMinQuality(parseInt(pMinQ, 10));
    const pAngle = localStorage.getItem(`${CAMERA_ANGLE_BASE_KEY}-${activeProjectId}`);
    if (pAngle) setCameraAngle(pAngle as any);
  }, [activeProjectId, setHistory, setGalleryImageKeys, setSynthModel, setImageSize, setEditPrompt, setBatchCount, setIsChainedMode, setIsBgReplaceMode, setMinQuality, setCameraAngle]);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme as Theme);
    }
  }, [setTheme]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      if (mediaQuery.matches) root.classList.add('dark');
      else root.classList.remove('dark');
      mediaQuery.addEventListener('change', handleSystemChange);
    }
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  useEffect(() => {
    if (itemToLoad) {
      resetState();
      if (previousObjectUrl.current) URL.revokeObjectURL(previousObjectUrl.current);
      getHistoryImage(itemToLoad.imageSrc).then((blob) => {
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          previousObjectUrl.current = objectUrl;
          setImageSrc(objectUrl);
        }
      });
      setDetectType(itemToLoad.detectType);
      setIsUploadedImage(true);
    }
  }, [itemToLoad, resetState, setImageSrc, setDetectType, setIsUploadedImage]);

  useEffect(() => {
    if (!imageSrc) {
      imageOptions.then((images) => { setImageSrc(images[0]); });
    }
    const params = hash();
    const taskParam = params.task;
    if (taskParam) {
      let newDetectType: DetectTypes | null = null;
      switch (taskParam) {
        case '2d-bounding-boxes': newDetectType = '2D bounding boxes'; break;
        case 'segmentation-masks': newDetectType = 'Segmentation masks'; break;
        case 'points': newDetectType = 'Points'; break;
        case '3d-bounding-boxes': newDetectType = '3D bounding boxes'; break;
      }
      if (newDetectType) setDetectType(newDetectType);
    }
  }, [setDetectType]);

  return (
    <div className="app-container flex flex-col h-[100dvh]">
      <ErrorToast />
      <TopBar />
      <div className="main-view grow overflow-hidden">
        <main className={`content-area transition-all duration-300 ${isInputPanelOpen ? '' : 'max-w-none w-full px-0'}`}>
          {initFinished ? <Content /> : null}
          <ExtraModeControls />
        </main>
        <InputPanel />
      </div>
      <HistoryPanel />
      <GalleryPanel />
      <Tutorial />
      <EngineeringGuide />
    </div>
  );
}

export default App;
