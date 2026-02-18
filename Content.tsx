
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {ResizePayload, useResizeDetector} from 'react-resize-detector';
import {GoogleGenAI} from '@google/genai';
import {
  BrushOpacityAtom,
  BrushShapeAtom,
  BrushSizeAtom,
  CurrentQualityMetadataAtom,
  SecondaryQualityMetadataAtom,
  GeneratedImageSrcAtom,
  SecondaryGeneratedImageSrcAtom,
  GeneratedImageKeyAtom,
  SecondaryGeneratedImageKeyAtom,
  GeneratedVideoUrlAtom,
  IsVideoLoadingAtom,
  IsUpscalingAtom,
  UpscaleSizeAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  ROIActiveShapeAtom,
  ROIAtom,
  ROICursorPosAtom,
  ROISelectedIdAtom,
  IsDualModelModeAtom,
  SynthesisModelAtom,
  SecondarySynthesisModelAtom,
  ShareStream,
  VideoRefAtom,
  ErrorAtom,
  ActiveProjectIdAtom,
  ZoomLevelAtom,
  PanOffsetAtom,
  IsMaskVisibleAtom,
} from './atoms';
import {useResetState, useROIDrawing, useManageGallery} from './hooks';
import {ROIPolygon, ROIBrush, GalleryImageMetadata} from './Types';
import {addGalleryMetadata} from './db';

function EditorHeader({ isComparisonMode, setIsComparisonMode }: { isComparisonMode: boolean, setIsComparisonMode: (v: boolean) => void }) {
  const [zoom, setZoom] = useAtom(ZoomLevelAtom);
  const [pan, setPan] = useAtom(PanOffsetAtom);
  const [isVisible, setIsVisible] = useAtom(IsMaskVisibleAtom);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => { setZoom(1); setPan({x: 0, y: 0}); };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-color)] border-b border-[var(--border-color)] shrink-0 z-30 shadow-sm">
      <div className="flex bg-[var(--bg-color-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
        <button 
          className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!isComparisonMode ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'text-[var(--text-color-secondary)] hover:bg-black/5'}`} 
          onClick={() => setIsComparisonMode(false)}
        >
          YAN YANA
        </button>
        <button 
          className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${isComparisonMode ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'text-[var(--text-color-secondary)] hover:bg-black/5'}`} 
          onClick={() => setIsComparisonMode(true)}
        >
          KARŞILAŞTIRMA
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-[var(--bg-color-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-xs font-bold">➖</button>
          <div className="flex items-center justify-center px-3 text-[10px] font-mono font-black min-w-[55px]">{Math.round(zoom * 100)}%</div>
          <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-xs font-bold">➕</button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
          <button onClick={handleReset} title="Görünümü Sıfırla" className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-sm">↺</button>
        </div>

        <button 
          onClick={() => setIsVisible(!isVisible)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${isVisible ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]' : 'bg-transparent text-[var(--text-color-secondary)] border-[var(--border-color)]'}`}
        >
          {isVisible ? '👁️ Maskeler Açık' : '🙈 Maskeler Kapalı'}
        </button>
      </div>
    </div>
  );
}

function ROIToolbar() {
  const [activeTool, setActiveTool] = useAtom(ROIActiveShapeAtom);
  const [rois, setRois] = useAtom(ROIAtom);
  const [selectedId, setSelectedId] = useAtom(ROISelectedIdAtom);
  const [brushSize, setBrushSize] = useAtom(BrushSizeAtom);

  const tools = [
    { id: 'select', icon: '🎯', label: 'Seç', key: 'V' },
    { id: 'pan', icon: '🤚', label: 'Kaydır', key: 'H' },
    { id: 'brush', icon: '🖌️', label: 'Fırça', key: 'B' },
    { id: 'rectangle', icon: '⬛', label: 'Kutu', key: 'R' },
    { id: 'circle', icon: '⭕', label: 'Daire', key: 'C' },
    { id: 'polygon', icon: '📐', label: 'Poligon', key: 'P' },
  ];

  return (
    <div className="flex flex-col gap-3 p-2 bg-[var(--bg-color)] border-r border-[var(--border-color)] z-20 overflow-y-auto w-[72px] shrink-0 h-full">
      <div className="flex flex-col gap-1.5">
        {tools.map(tool => (
          <button 
            key={tool.id} 
            title={`${tool.label} (${tool.key})`}
            className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl border-2 transition-all relative group ${activeTool === tool.id ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-lg' : 'border-transparent hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)]'}`} 
            onClick={() => {setActiveTool(tool.id as any); if (tool.id !== 'select') setSelectedId(null);}}
          >
            <span className="text-lg">{tool.icon}</span>
            <span className="text-[7px] font-black mt-0.5 uppercase opacity-60 group-hover:opacity-100">{tool.label}</span>
            {activeTool !== tool.id && (
               <span className="absolute bottom-1 right-1 text-[6px] font-bold opacity-30">{tool.key}</span>
            )}
          </button>
        ))}
      </div>

      <div className="w-full h-px bg-[var(--border-color)] my-1" />

      <button 
        className="w-12 h-12 flex flex-col items-center justify-center rounded-xl hover:bg-red-50 text-red-500 transition-colors border-2 border-transparent" 
        onClick={() => {setRois([]); setSelectedId(null);}}
        title="Tüm Maskeleri Temizle"
      >
        <span className="text-lg">🗑️</span>
        <span className="text-[7px] font-black uppercase mt-0.5">TEMİZLE</span>
      </button>

      {(activeTool === 'brush' || (selectedId && rois.find(r => r.id === selectedId)?.type === 'brush')) && (
        <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-[var(--text-color-secondary)] uppercase">Boyut</span>
              <span className="text-[10px] font-mono font-bold text-[var(--accent-color)]">{brushSize}px</span>
            </div>
            <div className="h-32 w-full flex justify-center">
               <input 
                type="range" 
                min="2" 
                max="150" 
                value={brushSize} 
                onChange={(e) => setBrushSize(Number(e.target.value))} 
                className="h-1.5 w-24 origin-center -rotate-90 mt-12 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QualityScoreOverlay({ metadata, imageKey, onClose }: { metadata: GalleryImageMetadata | null, imageKey: number | null, onClose: () => void }) {
  const [localMetadata, setLocalMetadata] = useState<GalleryImageMetadata | null>(metadata);

  useEffect(() => { setLocalMetadata(metadata); }, [metadata]);

  if (!localMetadata) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const handleRating = async (rating: 'up' | 'down') => {
    if (!imageKey) return;
    const updatedMeta: GalleryImageMetadata = { ...localMetadata, userRating: rating };
    setLocalMetadata(updatedMeta);
    await addGalleryMetadata(imageKey, updatedMeta);
  };

  return (
    <div className="absolute top-4 right-4 z-50 bg-white/95 dark:bg-black/90 p-5 rounded-2xl border border-[var(--border-color)] shadow-2xl min-w-[260px] backdrop-blur-md animate-in fade-in slide-in-from-right-4">
      {/* Kapatma Butonu */}
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div className="flex items-center gap-4 pr-6">
        <div className={`text-4xl font-black ${getScoreColor(localMetadata.qualityScore)}`}>{localMetadata.qualityScore}</div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">Kalite Analizi</span>
          <span className="text-xs italic leading-tight text-[var(--text-color-primary)] opacity-80">{localMetadata.qualityFeedback}</span>
        </div>
      </div>
      
      <div className="mt-5 pt-5 border-t border-[var(--border-color)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-[var(--text-color-secondary)]">Memnuniyet</span>
          <div className="flex gap-2">
            <button onClick={() => handleRating('up')} className={`p-2 rounded-xl transition-all ${localMetadata.userRating === 'up' ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'}`}>👍</button>
            <button onClick={() => handleRating('down')} className={`p-2 rounded-xl transition-all ${localMetadata.userRating === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>👎</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [generatedImageSrc, setGeneratedImageSrc] = useAtom(GeneratedImageSrcAtom);
  const [secondaryGeneratedImageSrc] = useAtom(SecondaryGeneratedImageSrcAtom);
  const [generatedImageKey] = useAtom(GeneratedImageKeyAtom);
  const [secondaryGeneratedImageKey] = useAtom(SecondaryGeneratedImageKeyAtom);
  const [qualityMetadata, setQualityMetadata] = useAtom(CurrentQualityMetadataAtom);
  const [secondaryQualityMetadata, setSecondaryQualityMetadata] = useAtom(SecondaryQualityMetadataAtom);
  
  const [generatedVideoUrl, setGeneratedVideoUrl] = useAtom(GeneratedVideoUrlAtom);
  const [isVideoLoading, setIsVideoLoading] = useAtom(IsVideoLoadingAtom);
  const [isUpscaling, setIsUpscaling] = useAtom(IsUpscalingAtom);
  const [upscaleSize, setUpscaleSize] = useAtom(UpscaleSizeAtom);
  const [stream] = useAtom(ShareStream);
  const [videoRef] = useAtom(VideoRefAtom);
  const [activeProjectId] = useAtom(ActiveProjectIdAtom);
  const [zoom, setZoom] = useAtom(ZoomLevelAtom);
  const [pan, setPan] = useAtom(PanOffsetAtom);
  const [isMaskVisible] = useAtom(IsMaskVisibleAtom);
  
  const [isDualMode] = useAtom(IsDualModelModeAtom);
  const [modelA] = useAtom(SynthesisModelAtom);
  const [modelB] = useAtom(SecondarySynthesisModelAtom);

  const setError = useSetAtom(ErrorAtom);
  const {addGalleryItem} = useManageGallery();

  const [rois] = useAtom(ROIAtom);
  const [roiActiveTool] = useAtom(ROIActiveShapeAtom);
  const [roiCursorPos] = useAtom(ROICursorPosAtom);
  const [selectedROIId] = useAtom(ROISelectedIdAtom);
  const [brushSize] = useAtom(BrushSizeAtom);

  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState({width: 0, height: 0});
  const [mediaDims, setMediaDims] = useState({width: 1, height: 1});
  const isPanningRef = useRef(false);
  const lastPanPos = useRef({x: 0, y: 0});
  
  const onResize = useCallback((el: ResizePayload) => { if (el.width && el.height) setContainerDims({width: el.width, height: el.height}); }, []);
  const {ref: containerRef} = useResizeDetector({onResize});

  const scaledMediaDims = useMemo(() => {
    const {width, height} = mediaDims;
    if (!containerDims.width || !containerDims.height || !width || !height) return {width: 0, height: 0};
    const aspectRatio = width / height;
    const containerAspectRatio = containerDims.width / containerDims.height;
    return aspectRatio < containerAspectRatio 
      ? { height: containerDims.height, width: containerDims.height * aspectRatio }
      : { width: containerDims.width, height: containerDims.width / aspectRatio };
  }, [containerDims, mediaDims]);

  const drawingContainerRef = useRef<HTMLDivElement | null>(null);
  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave } = useROIDrawing(drawingContainerRef, scaledMediaDims);

  const onPointerDown = (e: React.PointerEvent) => {
    if (roiActiveTool === 'pan' || e.button === 1) {
      isPanningRef.current = true;
      lastPanPos.current = {x: e.clientX, y: e.clientY};
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    handlePointerDown(e as any);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      const dx = (e.clientX - lastPanPos.current.x) / zoom;
      const dy = (e.clientY - lastPanPos.current.y) / zoom;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = {x: e.clientX, y: e.clientY};
      return;
    }
    handlePointerMove(e as any);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      return;
    }
    handlePointerUp(e as any);
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!comparisonRef.current) return;
    const rect = comparisonRef.current.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, position)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
    }
  };

  const transformStyle = {
    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
    transformOrigin: 'center center',
    width: '100%',
    height: '100%',
    transition: isPanningRef.current ? 'none' : 'transform 200ms cubic-bezier(0.19, 1, 0.22, 1)'
  };

  const generateVideoFromImage = async () => {
    if (!generatedImageSrc) return;
    setIsVideoLoading(true);
    setGeneratedVideoUrl(null);
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const base64 = generatedImageSrc.split(',')[1];
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'Professional cinematic movement',
        image: { imageBytes: base64, mimeType: 'image/png' },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '1:1' }
      });
      while (!operation.done) {
        await new Promise(r => setTimeout(r, 8000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await res.blob();
      setGeneratedVideoUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      setError("Video sentezi başarısız: " + e.message);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const upscaleImage = async () => {
    const source = generatedImageSrc || imageSrc;
    if (!source) return;
    setIsUpscaling(true);
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const base64 = source.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ inlineData: { data: base64, mimeType: 'image/png' } }, { text: `Upscale to ${upscaleSize}` }]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: upscaleSize } }
      });
      const upscaledBase64 = response.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
      if (upscaledBase64) setGeneratedImageSrc(`data:image/png;base64,${upscaledBase64}`);
    } catch (e: any) {
      setError("Upscale başarısız: " + e.message);
    } finally {
      setIsUpscaling(false);
    }
  };

  return (
    <div className="w-full flex h-full overflow-hidden bg-[var(--bg-color-secondary)]" onWheel={handleWheel}>
      {!isComparisonMode && <ROIToolbar />}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <EditorHeader isComparisonMode={isComparisonMode} setIsComparisonMode={setIsComparisonMode} />
        
        <div className="flex-1 relative min-h-0 flex gap-0 h-full overflow-hidden">
          {!isComparisonMode ? (
            <>
              {(!isDualMode || (!generatedImageSrc && !secondaryGeneratedImageSrc)) && (
                <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-color)] bg-black/5 dark:bg-black/40">
                  <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-color)]/50 border-b border-[var(--border-color)]">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">Giriş Görüntüsü</div>
                    {imageSrc && <div className="text-[9px] font-mono text-gray-400">{mediaDims.width}x{mediaDims.height}</div>}
                  </div>
                  <div ref={containerRef} className="relative flex-1 overflow-hidden bg-black shadow-inner group">
                    <div className="relative h-full" style={transformStyle} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={handlePointerLeave}>
                      {stream ? (
                        <video className="absolute top-0 left-0 w-full h-full object-contain" autoPlay ref={(v) => { if (v) { v.srcObject = stream; setMediaDims({width: v.videoWidth || 1, height: v.videoHeight || 1}); } }} />
                      ) : imageSrc ? (
                        <img src={imageSrc} className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" alt="Input" onLoad={(e) => setMediaDims({width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight})} />
                      ) : <div className="flex items-center justify-center h-full text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-40">Görüntü Bekleniyor</div>}
                      
                      <div ref={drawingContainerRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ width: scaledMediaDims.width, height: scaledMediaDims.height }}>
                        <svg className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${isMaskVisible ? 'opacity-100' : 'opacity-0'}`}>
                          {rois.map((shape) => {
                            const w = scaledMediaDims.width; const h = scaledMediaDims.height;
                            const isSelected = shape.id === selectedROIId;
                            const color = isSelected ? 'var(--accent-color)' : 'white';
                            return (
                              <g key={shape.id}>
                                {shape.type === 'brush' && <polyline points={shape.points.map(p => `${p.x * w},${p.y * h}`).join(' ')} stroke={color} strokeWidth={shape.strokeWidth * w} fill="none" strokeOpacity={shape.opacity} />}
                                {shape.type === 'rectangle' && <rect x={shape.x * w} y={shape.y * h} width={shape.width * w} height={shape.height * h} fill="rgba(255,255,255,0.1)" stroke={color} strokeWidth="2" />}
                                {shape.type === 'circle' && <circle cx={shape.x * w} cy={shape.y * h} r={shape.radius * w} fill="rgba(255,255,255,0.1)" stroke={color} strokeWidth="2" />}
                                {(shape.type === 'polygon' || shape.type === 'freehand') && <polyline points={shape.points.map(p => `${p.x * w},${p.y * h}`).join(' ')} fill="rgba(255,255,255,0.1)" stroke={color} strokeWidth="2" />}
                              </g>
                            );
                          })}
                          {roiCursorPos && roiActiveTool === 'brush' && <circle cx={roiCursorPos.x * scaledMediaDims.width} cy={roiCursorPos.y * scaledMediaDims.height} r={brushSize/2} fill="rgba(255,255,255,0.2)" stroke="white" />}
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col min-w-0 bg-black/10 dark:bg-black/60 border-r border-[var(--border-color)]">
                <div className="px-4 py-2 bg-[var(--bg-color)]/50 border-b border-[var(--border-color)]">
                   <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">
                    {isDualMode ? `MOTOR A: ${modelA}` : 'Sentezlenen Sonuç'}
                   </div>
                </div>
                <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
                  {qualityMetadata && !isDualMode && (
                    <QualityScoreOverlay 
                      metadata={qualityMetadata} 
                      imageKey={generatedImageKey} 
                      onClose={() => setQualityMetadata(null)}
                    />
                  )}
                  <div className="w-full h-full" style={transformStyle}>
                    {(isVideoLoading || isUpscaling) ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-12 h-12 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                        <div className="text-[10px] font-black text-white/50 animate-pulse">İŞLENİYOR...</div>
                      </div>
                    ) : generatedVideoUrl ? (
                      <video src={generatedVideoUrl} className="w-full h-full object-contain" autoPlay loop muted controls />
                    ) : generatedImageSrc ? (
                      <>
                        <img src={generatedImageSrc} className="w-full h-full object-contain" alt="Generated A" />
                        {!isDualMode && (
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
                            <button onClick={upscaleImage} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg">✨ UPSCALE</button>
                            <button onClick={generateVideoFromImage} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg">🎬 ANİMASYON</button>
                          </div>
                        )}
                      </>
                    ) : <div className="text-gray-500 opacity-30 uppercase font-black tracking-widest text-[10px] flex h-full items-center justify-center">Sonuç Bekleniyor</div>}
                  </div>
                </div>
              </div>

              {isDualMode && (
                <div className="flex-1 flex flex-col min-w-0 bg-black/20 dark:bg-black/80">
                  <div className="px-4 py-2 bg-[var(--bg-color)]/50 border-b border-[var(--border-color)]">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)]">MOTOR B: {modelB}</div>
                  </div>
                  <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
                    {secondaryQualityMetadata && (
                      <QualityScoreOverlay 
                        metadata={secondaryQualityMetadata} 
                        imageKey={secondaryGeneratedImageKey} 
                        onClose={() => setSecondaryQualityMetadata(null)}
                      />
                    )}
                    <div className="w-full h-full" style={transformStyle}>
                      {secondaryGeneratedImageSrc ? <img src={secondaryGeneratedImageSrc} className="w-full h-full object-contain" alt="Generated B" /> : <div className="text-gray-500 opacity-30 uppercase font-black tracking-widest text-[10px] flex h-full items-center justify-center">Sonuç Bekleniyor</div>}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden h-full">
              <div 
                ref={comparisonRef} 
                className="relative h-full w-full overflow-hidden cursor-col-resize group" 
                style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center center' }}
                onMouseMove={handleSliderMove} onTouchMove={handleSliderMove}
              >
                <img src={imageSrc || ''} className="absolute top-0 left-0 w-full h-full object-contain grayscale opacity-60" alt="Original" />
                <div className="absolute top-0 left-0 h-full overflow-hidden z-10" style={{ width: '100%', clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={(isDualMode && secondaryGeneratedImageSrc) ? secondaryGeneratedImageSrc : (generatedImageSrc || imageSrc || '')} className="absolute top-0 left-0 w-full h-full object-contain" alt="Comparison" />
                </div>
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_25px_rgba(255,255,255,0.9)] z-20" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-black text-2xl font-black">↔</div>
                </div>
                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-xl text-white text-[10px] px-4 py-2 rounded-full font-black z-30 border border-white/10">{(isDualMode && generatedImageSrc) ? `MOTOR A` : `ORİJİNAL`}</div>
                <div className="absolute top-6 right-6 bg-blue-600/80 backdrop-blur-xl text-white text-[10px] px-4 py-2 rounded-full font-black z-30 border border-white/10">{(isDualMode && secondaryGeneratedImageSrc) ? `MOTOR B` : `SENTEZLENEN`}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BoxMask() { return null; }
