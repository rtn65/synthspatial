
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
} from './atoms';
import {getGalleryImage, getGalleryMetadata, getAllGalleryMetadataForProject, getGalleryEntry} from './db';
import {useManageGallery, useResetState} from './hooks';
import {GalleryImageMetadata} from './Types';

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
            className="relative w-full h-full cursor-col-resize select-none overflow-hidden rounded-lg group"
            onMouseMove={handleMove} onTouchMove={handleMove}
        >
            <img src={original} className="absolute inset-0 w-full h-full object-contain grayscale opacity-60" />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <img src={generated} className="absolute inset-0 w-full h-full object-contain" />
            </div>
             <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 group-hover:bg-[var(--accent-color)] transition-colors" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-black text-xs font-black">↔</div>
            </div>
            <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Orijinal</div>
            <div className="absolute top-4 right-4 bg-[var(--accent-color)] text-white text-[10px] px-2 py-1 rounded shadow-lg">Sonuç</div>
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
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-color)] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-30 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Image Area */}
        <div className="flex-1 bg-black/5 flex items-center justify-center p-4 relative group">
          {originalUrl ? (
              <GalleryComparisonSlider original={originalUrl} generated={generatedUrl} />
          ) : (
              <img src={generatedUrl} alt="Detail" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96 bg-[var(--bg-color-secondary)] border-l border-[var(--border-color)] flex flex-col z-20 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Analiz Raporu</h3>
                <p className="text-xs text-[var(--text-color-secondary)] opacity-60 font-mono mt-1">ID: {id}</p>
              </div>
              <div className={`text-4xl font-black ${scoreColor(metadata?.qualityScore)}`}>
                {metadata?.qualityScore || 'N/A'}
              </div>
            </div>

            {metadata ? (
              <div className="space-y-6">
                <div className="bg-[var(--bg-color)] p-4 rounded-2xl border border-[var(--border-color)]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)] mb-2">Görüş</div>
                  <p className="text-sm font-medium leading-relaxed">{metadata.qualityFeedback}</p>
                </div>

                {metadata.improvementSuggestion && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Öneri</div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{metadata.improvementSuggestion}</p>
                  </div>
                )}

                <div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-secondary)] mb-2">Kullanıcı Puanı</div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => onRate('up')}
                       className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${metadata.userRating === 'up' ? 'bg-green-500 text-white border-green-500' : 'bg-[var(--bg-color)] hover:bg-gray-100 border-[var(--border-color)]'}`}
                     >
                       👍 Beğendim
                     </button>
                     <button 
                       onClick={() => onRate('down')}
                       className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${metadata.userRating === 'down' ? 'bg-red-500 text-white border-red-500' : 'bg-[var(--bg-color)] hover:bg-gray-100 border-[var(--border-color)]'}`}
                     >
                       👎 Kötü
                     </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-[var(--text-color-secondary)] italic">Analiz verisi bulunamadı.</div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col gap-2">
            <button onClick={onUse} className="w-full py-3 bg-[var(--accent-color)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              🎨 Editöre Aktar
            </button>
            <button onClick={onDelete} className="w-full py-3 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors">
              🗑️ Kalıcı Olarak Sil
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
    if (!score) return '#9ca3af';
    if (score >= 85) return '#22c55e';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  };

  return (
    <div 
      className={`relative aspect-square group rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30 scale-95' : 'border-transparent hover:border-gray-300'}`}
      onClick={() => onClick(item.id)}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Gallery Item" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full bg-gray-100 animate-pulse" />
      )}
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Selection Checkbox */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white' : 'bg-black/20 border-white/50 hover:bg-black/40'}`}
      >
        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
      </button>

      {/* Score Badge */}
      {item.metadata?.qualityScore && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: getScoreColor(item.metadata.qualityScore) }}>
          {item.metadata.qualityScore}
        </div>
      )}

      {/* Info on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
         <div className="flex justify-between items-end">
           {item.metadata?.userRating && (
             <span className="text-lg drop-shadow-md">{item.metadata.userRating === 'up' ? '👍' : '👎'}</span>
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
      result = result.filter(i => (i.metadata?.qualityScore || 0) >= 80);
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
    if (confirm(`${ids.length} görseli silmek istediğinize emin misiniz?`)) {
      await deleteGalleryItems(ids);
      setSelectedImageIds(new Set());
      setDetailViewId(null);
    }
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
        <div className="flex items-center justify-between p-5 border-b shrink-0 bg-[var(--bg-color)] z-10">
          <div>
             <h2 className="text-xl font-black tracking-tight">Galeri</h2>
             <p className="text-xs text-[var(--text-color-secondary)]">{allItems.length} Görsel</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="secondary !p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b bg-[var(--bg-color-secondary)] flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="flex gap-4">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[var(--bg-color)] border border-[var(--border-color)] text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-color)]"
            >
              <option value="newest">📅 En Yeni</option>
              <option value="oldest">📅 En Eski</option>
              <option value="highest_score">✨ En Yüksek Puan</option>
              <option value="lowest_score">⚠️ En Düşük Puan</option>
            </select>
            
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="bg-[var(--bg-color)] border border-[var(--border-color)] text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-color)]"
            >
              <option value="all">👁️ Tümü</option>
              <option value="favorites">❤️ Favoriler</option>
              <option value="high_quality">💎 Yüksek Kalite (+80)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (isSelectionMode) setSelectedImageIds(new Set());
                setIsSelectionMode(!isSelectionMode);
              }}
              className={`text-sm font-bold px-4 py-2 rounded-lg border transition-all ${isSelectionMode ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]' : 'bg-[var(--bg-color)] border-[var(--border-color)]'}`}
            >
              {isSelectionMode ? 'Seçimi Bitir' : 'Çoklu Seçim'}
            </button>
          </div>
        </div>

        {/* Batch Actions Bar (Conditional) */}
        {selectedImageIds.size > 0 && (
          <div className="bg-[var(--accent-color)] text-white px-6 py-3 text-sm font-bold flex justify-between items-center animate-in slide-in-from-bottom-2 z-20">
            <span>{selectedImageIds.size} görsel seçildi</span>
            <div className="flex gap-4">
              <button onClick={() => setSelectedImageIds(new Set<number>(processedItems.map(i => i.id)))} className="hover:bg-white/20 px-3 py-1.5 rounded transition-colors">Tümünü Seç</button>
              <button onClick={handleExport} disabled={isExporting} className="hover:bg-white/20 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
                {isExporting ? 'Sıkıştırılıyor...' : '📥 Toplu İndir'}
              </button>
              {/* Fix: Explicitly cast Array.from result to handle unknown type errors in handleDelete argument. */}
              <button onClick={() => handleDelete(Array.from(selectedImageIds) as number[])} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded flex items-center gap-2 transition-colors shadow-lg">
                🗑️ Seçilenleri Sil
              </button>
            </div>
          </div>
        )}

        {/* Grid Area */}
        <div className="flex-grow overflow-y-auto p-6 bg-[var(--bg-color-secondary)]/50">
          {processedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-color-secondary)] opacity-60">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-lg font-bold">Görsel bulunamadı</p>
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
        <div className="p-4 border-t bg-[var(--bg-color)] flex justify-end">
          <button 
             onClick={() => activeProjectId && clearGallery(activeProjectId)}
             disabled={processedItems.length === 0}
             className="px-4 py-2 text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Tüm Proje Galerisini Temizle
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
