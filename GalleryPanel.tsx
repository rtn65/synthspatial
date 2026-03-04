
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import JSZip from 'jszip';
import React, {FunctionComponent, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActiveProjectGalleryImagesAtom,
  ActiveProjectIdAtom,
  ImageSrcAtom,
  GeneratedImageSrcAtom,
  GeneratedImageKeyAtom,
  CurrentQualityMetadataAtom,
  IsGalleryPanelOpenAtom,
  IsUploadedImageAtom,
  MinQualityThresholdAtom,
} from './atoms';
import {getGalleryImage, getGalleryMetadata, getAllGalleryMetadataForProject, getGalleryEntry} from './db';
import {useManageGallery, useResetState} from './hooks';
import {GalleryImageMetadata} from './Types';
import { X, ArrowLeftRight, ThumbsUp, ThumbsDown, Trash2, Edit3, Image as ImageIcon, Calendar, Star, AlertTriangle, Eye, Heart, Diamond, CheckSquare, Square, Download, Package, Trash } from 'lucide-react';

// --- Types & Interfaces ---
interface GalleryItemData {
  id: number;
  metadata?: GalleryImageMetadata;
}

type SortOption = 'newest' | 'oldest' | 'highest_score' | 'lowest_score';
type FilterOption = 'all' | 'favorites' | 'high_quality';

// --- Components ---

function GalleryComparisonSlider({ original, generated }: { original: string, generated: string }) {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const pos = ((x - rect.left) / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, pos)));
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full cursor-col-resize select-none overflow-hidden rounded-xl group"
            onMouseMove={handleMove} onTouchMove={handleMove}
        >
            <img src={original} className="absolute inset-0 w-full h-full object-contain grayscale opacity-60" />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <img src={generated} className="absolute inset-0 w-full h-full object-contain" />
            </div>
             <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 group-hover:bg-[var(--accent-color)] transition-colors" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-black">
                    <ArrowLeftRight size={14} strokeWidth={3} />
                  </div>
            </div>
            <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-medium">Original</div>
            <div className="absolute top-4 right-4 bg-[var(--accent-color)] text-white text-[10px] px-2 py-1 rounded shadow-lg font-medium">Result</div>
        </div>
    )
}

const GalleryDetailModal: FunctionComponent<{
  id: number;
  metadata?: GalleryImageMetadata;
  onClose: () => void;
  onUse: () => void;
  onDelete: () => void;
  onRate: (rating: 'up' | 'down') => void;
}> = ({id, metadata, onClose, onUse, onDelete, onRate}) => {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  useEffect(() => {
    let gUrl: string | null = null;
    let oUrl: string | null = null;
    
    getGalleryEntry(id).then((entry) => {
      if (entry) {
        gUrl = URL.createObjectURL(entry.image);
        setGeneratedUrl(gUrl);
        if (entry.originalImage) {
            oUrl = URL.createObjectURL(entry.originalImage);
            setOriginalUrl(oUrl);
        }
      }
    });

    return () => { 
        if (gUrl) URL.revokeObjectURL(gUrl);
        if (oUrl) URL.revokeObjectURL(oUrl);
    };
  }, [id]);

  if (!generatedUrl) return null;

  const scoreColor = (score?: number) => {
    if (!score) return 'text-[var(--text-color-secondary)]';
    if (score >= 85) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-color)] w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative border border-[var(--border-color)]">
        <button onClick={onClose} className="absolute top-4 right-4 z-30 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md">
          <X size={20} />
        </button>

        {/* Image Area */}
        <div className="flex-1 bg-[var(--bg-color-secondary)] flex items-center justify-center p-4 relative group">
          {originalUrl ? (
              <GalleryComparisonSlider original={originalUrl} generated={generatedUrl} />
          ) : (
              <img src={generatedUrl} alt="Detail" className="max-w-full max-h-full object-contain shadow-sm rounded-xl" />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96 bg-[var(--bg-color)] border-l border-[var(--border-color)] flex flex-col z-20">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--text-color-primary)]">Analysis Report</h3>
                <p className="text-[10px] text-[var(--text-color-secondary)] font-mono mt-1">ID: {id}</p>
              </div>
              <div className={`text-3xl font-bold font-mono ${scoreColor(metadata?.qualityScore)}`}>
                {metadata?.qualityScore || 'N/A'}
              </div>
            </div>

            {metadata ? (
              <div className="space-y-6">
                <div className="bg-[var(--bg-color-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                  <div className="micro-label mb-2">Feedback</div>
                  <p className="text-sm text-[var(--text-color-primary)] leading-relaxed">{metadata.qualityFeedback}</p>
                </div>

                {metadata.improvementSuggestion && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                    <div className="micro-label !text-indigo-600 dark:!text-indigo-400 mb-2">Suggestion</div>
                    <p className="text-sm text-indigo-900 dark:text-indigo-300 leading-relaxed">{metadata.improvementSuggestion}</p>
                  </div>
                )}

                <div>
                   <div className="micro-label mb-2">User Rating</div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => onRate('up')}
                       className={`flex-1 py-2.5 rounded-lg border font-medium text-xs transition-all flex items-center justify-center gap-2 ${metadata.userRating === 'up' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-[var(--bg-color-secondary)] hover:bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)]'}`}
                     >
                       <ThumbsUp size={14} /> Good
                     </button>
                     <button 
                       onClick={() => onRate('down')}
                       className={`flex-1 py-2.5 rounded-lg border font-medium text-xs transition-all flex items-center justify-center gap-2 ${metadata.userRating === 'down' ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-[var(--bg-color-secondary)] hover:bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)]'}`}
                     >
                       <ThumbsDown size={14} /> Poor
                     </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-[var(--text-color-secondary)] text-sm">No analysis data available.</div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-color-secondary)] flex flex-col gap-2">
            <button onClick={onUse} className="w-full py-2.5 bg-[var(--accent-color)] text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm">
              <Edit3 size={16} /> Send to Editor
            </button>
            <button onClick={onDelete} className="w-full py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
              <Trash2 size={16} /> Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GalleryThumbnail: FunctionComponent<{
  item: GalleryItemData;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onClick: (id: number) => void;
}> = ({item, isSelected, onToggleSelect, onClick}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;
    getGalleryImage(item.id).then((blob) => {
      if (isMounted && blob) {
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      }
    });
    return () => { isMounted = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id]);

  const getScoreColor = (score?: number) => {
    if (!score) return '#94a3b8'; // slate-400
    if (score >= 85) return '#10b981'; // emerald-500
    if (score >= 60) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  return (
    <div 
      className={`relative aspect-square group rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20 scale-[0.98]' : 'border-transparent hover:border-[var(--border-color)]'}`}
      onClick={() => onClick(item.id)}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Gallery Item" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full bg-[var(--bg-color-secondary)] animate-pulse" />
      )}
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Selection Checkbox */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-md border flex items-center justify-center transition-all shadow-sm ${isSelected ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white' : 'bg-black/20 border-white/50 text-transparent hover:bg-black/40 hover:border-white'}`}
      >
        <CheckSquare size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
      </button>

      {/* Score Badge */}
      {item.metadata?.qualityScore && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-sm" style={{ backgroundColor: getScoreColor(item.metadata.qualityScore) }}>
          {item.metadata.qualityScore}
        </div>
      )}

      {/* Info on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
         <div className="flex justify-between items-end">
           {item.metadata?.userRating && (
             <span className="text-white drop-shadow-md">
               {item.metadata.userRating === 'up' ? <ThumbsUp size={14} className="text-emerald-400" fill="currentColor" /> : <ThumbsDown size={14} className="text-rose-400" fill="currentColor" />}
             </span>
           )}
           <span className="text-[10px] text-white/80 font-mono ml-auto">
             {new Date(item.id).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
           </span>
         </div>
      </div>
    </div>
  );
};

export function GalleryPanel() {
  const [isOpen, setIsOpen] = useAtom(IsGalleryPanelOpenAtom);
  const [activeProjectGalleryKeys] = useAtom(ActiveProjectGalleryImagesAtom); // Just keys from Atom
  const [activeProjectId] = useAtom(ActiveProjectIdAtom);
  const [minQuality] = useAtom(MinQualityThresholdAtom);
  const {clearGallery, deleteGalleryItems, addGalleryItem} = useManageGallery();
  
  // Editor State setters
  const setImageSrc = useSetAtom(ImageSrcAtom);
  const setGeneratedImageSrc = useSetAtom(GeneratedImageSrcAtom);
  const setGeneratedImageKey = useSetAtom(GeneratedImageKeyAtom);
  const setQualityMetadata = useSetAtom(CurrentQualityMetadataAtom);
  const setIsUploadedImage = useSetAtom(IsUploadedImageAtom);
  const resetState = useResetState();

  // Local State
  const [allItems, setAllItems] = useState<GalleryItemData[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [detailViewId, setDetailViewId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Sort & Filter State
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // 1. Fetch metadata for all keys when keys or project changes
  useEffect(() => {
    if (!activeProjectId) return;
    
    const fetchData = async () => {
      // Better approach: Fetch all items based on keys
      const items: GalleryItemData[] = [];
      for (const key of activeProjectGalleryKeys) {
        const meta = await getGalleryMetadata(key);
        items.push({ id: key, metadata: meta });
      }
      setAllItems(items);
    };
    
    if (isOpen) {
      fetchData();
    }
  }, [activeProjectId, activeProjectGalleryKeys, isOpen]);

  // 2. Filter and Sort Logic
  const processedItems = useMemo(() => {
    let result = [...allItems];

    // Filter
    if (filterBy === 'favorites') {
      result = result.filter(i => i.metadata?.userRating === 'up');
    } else if (filterBy === 'high_quality') {
      result = result.filter(i => (i.metadata?.qualityScore || 0) >= minQuality);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.id - a.id;
        case 'oldest': return a.id - b.id;
        case 'highest_score': return (b.metadata?.qualityScore || 0) - (a.metadata?.qualityScore || 0);
        case 'lowest_score': return (a.metadata?.qualityScore || 0) - (b.metadata?.qualityScore || 0);
        default: return 0;
      }
    });

    return result;
  }, [allItems, sortBy, filterBy]);

  // Handlers
  const handleToggleSelection = (id: number) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleUseImage = async (id: number) => {
    resetState();
    const entry = await getGalleryEntry(id);
    const meta = await getGalleryMetadata(id);
    if (entry) {
      const objectUrl = URL.createObjectURL(entry.image);
      setGeneratedImageSrc(objectUrl);
      setGeneratedImageKey(id);
      
      if (entry.originalImage) {
        const originalUrl = URL.createObjectURL(entry.originalImage);
        setImageSrc(originalUrl);
      } else {
        // Fallback: If no original, assume generated is input for new edits
        setImageSrc(objectUrl);
      }

      if (meta) setQualityMetadata(meta as GalleryImageMetadata);
      setIsUploadedImage(true);
      setIsOpen(false);
      setDetailViewId(null);
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (confirm(`${ids.length} images will be permanently deleted. Are you sure?`)) {
      await deleteGalleryItems(ids);
      setSelectedImageIds(new Set());
      setDetailViewId(null);
    }
  };

  const handleDatasetExport = async () => {
    if (selectedImageIds.size === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const labelsFolder = zip.folder('labels');
      
      if (imagesFolder && labelsFolder) {
        await Promise.all((Array.from(selectedImageIds) as number[]).map(async (id) => {
          const blob = await getGalleryImage(id);
          const meta = await getGalleryMetadata(id);
          
          if (blob) {
            imagesFolder.file(`${id}.png`, blob);
            
            // Generate YOLO labels if ROIs exist
            if (meta && meta.rois && meta.rois.length > 0) {
              let labelContent = "";
              meta.rois.forEach(roi => {
                let x, y, w, h;
                
                if (roi.type === 'rectangle') {
                  x = roi.x + roi.width / 2;
                  y = roi.y + roi.height / 2;
                  w = roi.width;
                  h = roi.height;
                } else if (roi.type === 'circle') {
                  x = roi.x;
                  y = roi.y;
                  w = roi.radius * 2;
                  h = roi.radius * 2;
                } else if (roi.points) {
                  // Calculate bounding box for polygon/brush
                  const xs = roi.points.map(p => p.x);
                  const ys = roi.points.map(p => p.y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  w = maxX - minX;
                  h = maxY - minY;
                  x = minX + w / 2;
                  y = minY + h / 2;
                }
                
                if (x !== undefined && y !== undefined && w !== undefined && h !== undefined) {
                  // Ensure values are within 0-1
                  x = Math.max(0, Math.min(1, x));
                  y = Math.max(0, Math.min(1, y));
                  w = Math.max(0, Math.min(1, w));
                  h = Math.max(0, Math.min(1, h));
                  
                  // Class ID 0 (default)
                  labelContent += `0 ${x.toFixed(6)} ${y.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}\n`;
                }
              });
              
              if (labelContent) {
                labelsFolder.file(`${id}.txt`, labelContent);
              }
            }
          }
        }));
        
        zip.file("classes.txt", "object\n");
        zip.file("data.yaml", "train: ../train/images\nval: ../valid/images\n\nnc: 1\nnames: ['object']");
      }
      
      const content = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-yolo-${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const handleExport = async () => {
    if (selectedImageIds.size === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('synth-gallery');
      if (folder) {
        // Fix: Explicitly cast Array.from result to handle unknown type errors in map callback argument.
        await Promise.all((Array.from(selectedImageIds) as number[]).map(async (id) => {
          const blob = await getGalleryImage(id);
          if (blob) folder.file(`image-${id}.png`, blob);
        }));
      }
      const content = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synth-export-${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const handleRate = async (id: number, rating: 'up' | 'down') => {
    const item = allItems.find(i => i.id === id);
    if (item && item.metadata) {
      // Update DB using the hook's underlying logic would be best, 
      // but here we can re-add with updated metadata
      // Importing DB function directly for update
      const { addGalleryMetadata } = await import('./db');
      const newMeta = { ...item.metadata, userRating: rating };
      await addGalleryMetadata(id, newMeta);
      
      // Update local state to reflect change immediately
      setAllItems(prev => prev.map(i => i.id === id ? { ...i, metadata: newMeta } : i));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`gallery-panel ${isOpen ? 'open' : ''} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-color)] z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[var(--bg-color-secondary)] rounded-lg border border-[var(--border-color)]">
               <ImageIcon size={20} className="text-[var(--text-color-secondary)]" />
             </div>
             <div>
               <h2 className="text-lg font-semibold tracking-tight text-[var(--text-color-primary)]">Gallery</h2>
               <p className="text-[11px] text-[var(--text-color-secondary)] font-medium">{allItems.length} Items</p>
             </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-color-secondary)] text-[var(--text-color-secondary)] hover:text-[var(--text-color-primary)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-color-secondary)] flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="flex gap-3">
            <div className="relative">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-[var(--bg-color)] border border-[var(--border-color)] text-xs font-medium rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)] text-[var(--text-color-primary)]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_score">Highest Score</option>
                <option value="lowest_score">Lowest Score</option>
              </select>
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-color-secondary)] pointer-events-none" />
            </div>
            
            <div className="relative">
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="appearance-none bg-[var(--bg-color)] border border-[var(--border-color)] text-xs font-medium rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)] text-[var(--text-color-primary)]"
              >
                <option value="all">All Items</option>
                <option value="favorites">Favorites</option>
                <option value="high_quality">High Quality (+{minQuality})</option>
              </select>
              <Eye size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-color-secondary)] pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (isSelectionMode) setSelectedImageIds(new Set());
                setIsSelectionMode(!isSelectionMode);
              }}
              className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${isSelectionMode ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm' : 'bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color-primary)] hover:bg-[var(--bg-color-secondary)]'}`}
            >
              {isSelectionMode ? <><X size={14} /> Cancel Selection</> : <><CheckSquare size={14} /> Select Multiple</>}
            </button>
          </div>
        </div>

        {/* Batch Actions Bar (Conditional) */}
        {selectedImageIds.size > 0 && (
          <div className="bg-[var(--accent-color)] text-white px-5 py-3 text-xs font-medium flex justify-between items-center animate-in slide-in-from-bottom-2 z-20 shadow-md">
            <span className="flex items-center gap-2"><CheckSquare size={14} /> {selectedImageIds.size} selected</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedImageIds(new Set<number>(processedItems.map(i => i.id)))} className="hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                <Square size={14} /> Select All
              </button>
              <button onClick={handleDatasetExport} disabled={isExporting} className="hover:bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-white/20">
                <Package size={14} /> {isExporting ? 'Preparing...' : 'Export YOLO'}
              </button>
              <button onClick={handleExport} disabled={isExporting} className="hover:bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-white/20">
                <Download size={14} /> {isExporting ? 'Zipping...' : 'Download'}
              </button>
              {/* Fix: Explicitly cast Array.from result to handle unknown type errors in handleDelete argument. */}
              <button onClick={() => handleDelete(Array.from(selectedImageIds) as number[])} className="bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ml-2">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Grid Area */}
        <div className="flex-grow overflow-y-auto p-6 bg-[var(--bg-color)]">
          {processedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-color-secondary)]">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">No images found</p>
              <p className="text-xs opacity-70 mt-1">Generate some images to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 pb-20">
              {processedItems.map(item => (
                <GalleryThumbnail 
                  key={item.id} 
                  item={item} 
                  isSelected={selectedImageIds.has(item.id)}
                  onToggleSelect={handleToggleSelection}
                  onClick={(id: number) => isSelectionMode ? handleToggleSelection(id) : setDetailViewId(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-color-secondary)] flex justify-end">
          <button 
             onClick={() => activeProjectId && clearGallery(activeProjectId)}
             disabled={processedItems.length === 0}
             className="px-4 py-2 text-xs font-medium text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash size={14} /> Clear Project Gallery
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {detailViewId !== null && (
        <GalleryDetailModal 
          id={detailViewId} 
          metadata={allItems.find(i => i.id === detailViewId)?.metadata}
          onClose={() => setDetailViewId(null)}
          onUse={() => handleUseImage(detailViewId)}
          onDelete={() => handleDelete([detailViewId as number])}
          onRate={(rating) => handleRate(detailViewId, rating)}
        />
      )}
    </>
  );
}
