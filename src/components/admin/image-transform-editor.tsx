'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Upload,
  Check,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Crop,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeroTornPaper } from '@/components/ui/hero-torn-paper';
import { compressImageFile } from '@/lib/image-optimizer';
import type { ImageTransform } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImageTransformEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  initialTransform?: ImageTransform | null;
  aspectRatio?: '16/9' | '1/1' | '4/5' | '16/7' | '3/4';
  showTornPaperOverlay?: boolean;
  title?: string;
  description?: string;
  onSave: (result: { imageUrl: string; transform: ImageTransform }) => void;
}

const DEFAULT_TRANSFORM: ImageTransform = { zoom: 1, x: 0, y: 0 };

export function ImageTransformEditor({
  open,
  onOpenChange,
  imageUrl: initialUrl,
  initialTransform,
  aspectRatio = '1/1',
  showTornPaperOverlay = false,
  title = 'Adjust, Zoom & Crop Image',
  description = 'Drag the image directly inside the frame, zoom in/out, or upload a new photo so it fits edge-to-edge cleanly.',
  onSave,
}: ImageTransformEditorProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [transform, setTransform] = useState<ImageTransform>(
    initialTransform ? { ...initialTransform } : { ...DEFAULT_TRANSFORM }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl || '');
      setTransform(
        initialTransform
          ? {
              zoom: Number(initialTransform.zoom) || 1,
              x: Number(initialTransform.x) || 0,
              y: Number(initialTransform.y) || 0,
            }
          : { ...DEFAULT_TRANSFORM }
      );
    }
  }, [open, initialUrl, initialTransform]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const maxDim = aspectRatio === '1/1' ? 1000 : 1600;
      const compressed = await compressImageFile(file, maxDim, 0.84);
      setUrl(compressed);
      setTransform({ zoom: 1, x: 0, y: 0 });
    } catch {
      // ignore invalid file
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const clampPos = (val: number) => Math.max(-50, Math.min(50, Math.round(val * 10) / 10));

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      clientX,
      clientY,
      startX: transform.x,
      startY: transform.y,
    };
  };

  const onDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dxPct = ((clientX - dragStartRef.current.clientX) / Math.max(1, rect.width)) * 100;
    const dyPct = ((clientY - dragStartRef.current.clientY) / Math.max(1, rect.height)) * 100;
    setTransform((prev) => ({
      ...prev,
      x: clampPos(dragStartRef.current!.startX + dxPct),
      y: clampPos(dragStartRef.current!.startY + dyPct),
    }));
  };

  const endDrag = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-[16/9] max-w-xl'
      : aspectRatio === '16/7'
        ? 'aspect-[16/7] max-w-xl'
        : aspectRatio === '4/5'
          ? 'aspect-[4/5] max-w-[300px]'
          : aspectRatio === '3/4'
            ? 'aspect-[3/4] max-w-[280px]'
            : 'aspect-square max-w-[340px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Crop className="w-5 h-5 text-purple-600" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Upload or Paste URL */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste HTTPS Image URL or upload from device →"
              className="flex-1 h-10 rounded-xl text-xs border-slate-200"
            />
            <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold shrink-0 transition-colors">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{isUploading ? 'Processing...' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Interactive Fixed-Template Crop Canvas */}
          <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-purple-600" /> Drag inside frame to reposition
              </span>
              <span>
                Template: {aspectRatio === '1/1' ? 'Fixed 1:1 Square' : aspectRatio}
                {showTornPaperOverlay ? ' + Torn Paper Bottom' : ''}
              </span>
            </div>

            <div
              ref={frameRef}
              onMouseDown={(e) => {
                e.preventDefault();
                startDrag(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => onDragMove(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={(e) => {
                if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) onDragMove(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={endDrag}
              className={cn(
                'relative w-full mx-auto overflow-hidden rounded-2xl shadow-inner border-2 border-purple-400 bg-white select-none',
                isDragging ? 'cursor-grabbing' : 'cursor-grab',
                aspectClass
              )}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    transform: `translate(${transform.x}%, ${transform.y}%) scale(${transform.zoom})`,
                    transformOrigin: 'center center',
                  }}
                  className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-75"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                  Upload or paste an image URL above
                </div>
              )}

              {/* Rule-of-thirds alignment grid */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="border border-white/70" />
                ))}
              </div>

              {/* Fixed Torn Paper Bottom Preview */}
              {showTornPaperOverlay && (
                <HeroTornPaper className="absolute -bottom-[1px] left-0 right-0" />
              )}
            </div>
          </div>

          {/* Zoom & Position Sliders */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                  Zoom &amp; Resize
                </span>
                <span className="text-purple-700 font-black">{Math.round(transform.zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTransform((p) => ({ ...p, zoom: Math.max(1, Number((p.zoom - 0.1).toFixed(2))) }))
                  }
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={transform.zoom}
                  onChange={(e) => setTransform((p) => ({ ...p, zoom: Number(e.target.value) }))}
                  className="flex-1 accent-purple-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    setTransform((p) => ({ ...p, zoom: Math.min(3, Number((p.zoom + 0.1).toFixed(2))) }))
                  }
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Horizontal & Vertical Sliders + Nudge Arrows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Move Left / Right</span>
                  <span className="text-purple-700">{transform.x}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={transform.x}
                  onChange={(e) => setTransform((p) => ({ ...p, x: Number(e.target.value) }))}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Move Up / Down</span>
                  <span className="text-purple-700">{transform.y}%</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={transform.y}
                  onChange={(e) => setTransform((p) => ({ ...p, y: Number(e.target.value) }))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            {/* Quick Nudge & Reset Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTransform((p) => ({ ...p, x: clampPos(p.x - 3) }))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700"
                  title="Move Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransform((p) => ({ ...p, x: clampPos(p.x + 3) }))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700"
                  title="Move Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransform((p) => ({ ...p, y: clampPos(p.y - 3) }))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransform((p) => ({ ...p, y: clampPos(p.y + 3) }))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-slate-700"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setTransform({ ...DEFAULT_TRANSFORM })}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Center
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!url.trim()}
            onClick={() => {
              onSave({ imageUrl: url.trim(), transform });
              onOpenChange(false);
            }}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Crop &amp; Position
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
