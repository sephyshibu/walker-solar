import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FiX, FiCheck, FiZoomIn, FiZoomOut, FiRotateCw, FiCrop } from 'react-icons/fi';
import './imagecropModal.css';

interface ImageCropModalProps {
  /** The image file to crop */
  imageFile: File;
  /** Aspect ratio width (default: 1) */
  aspectWidth?: number;
  /** Aspect ratio height (default: 1) */
  aspectHeight?: number;
  /** Output width in pixels (default: 800) */
  outputWidth?: number;
  /** Output quality 0-1 (default: 0.92) */
  quality?: number;
  /** Called with the cropped File when user confirms */
  onCropComplete: (croppedFile: File) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageFile,
  aspectWidth = 1,
  aspectHeight = 1,
  outputWidth = 800,
  quality = 0.92,
  onCropComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Transform state
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffsetStart, setDragOffsetStart] = useState({ x: 0, y: 0 });

  // Canvas / crop frame dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  const aspectRatio = aspectWidth / aspectHeight;

  // Load image from file
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // When image loads, calculate initial fit
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setImageLoaded(true);

      // Calculate canvas display size based on container
      const container = containerRef.current;
      if (container) {
        const maxW = Math.min(container.clientWidth - 40, 600);
        const maxH = Math.min(window.innerHeight * 0.55, 600);
        let cw, ch;
        if (aspectRatio >= 1) {
          cw = Math.min(maxW, maxH * aspectRatio);
          ch = cw / aspectRatio;
        } else {
          ch = Math.min(maxH, maxW / aspectRatio);
          cw = ch * aspectRatio;
        }
        setCanvasSize({ width: Math.round(cw), height: Math.round(ch) });
      }

      // Fit image to cover the crop area
      const imgAspect = img.width / img.height;
      let fitScale;
      if (imgAspect > aspectRatio) {
        // Image is wider, fit by height
        fitScale = 1; // We'll base scale so height fills
      } else {
        // Image is taller, fit by width
        fitScale = 1;
      }
      setScale(fitScale);
      setOffsetX(0);
      setOffsetY(0);
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc, aspectRatio]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageEl) return;

    const { width: cw, height: ch } = canvasSize;
    canvas.width = cw;
    canvas.height = ch;

    ctx.clearRect(0, 0, cw, ch);

    // Fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2 + offsetX, ch / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Calculate draw size so image covers the crop area at scale=1
    const imgAspect = imageEl.width / imageEl.height;
    let drawW, drawH;
    if (imgAspect > aspectRatio) {
      drawH = ch;
      drawW = drawH * imgAspect;
    } else {
      drawW = cw;
      drawH = drawW / imgAspect;
    }

    ctx.drawImage(imageEl, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [imageEl, canvasSize, scale, offsetX, offsetY, rotation, aspectRatio]);

  useEffect(() => {
    if (imageLoaded) {
      requestAnimationFrame(draw);
    }
  }, [imageLoaded, draw]);

  // Mouse / Touch handlers for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffsetStart({ x: offsetX, y: offsetY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffsetX(dragOffsetStart.x + dx);
    setOffsetY(dragOffsetStart.y + dy);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Scroll to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((prev) => Math.max(0.2, Math.min(5, prev + delta)));
  };

  // Zoom buttons
  const zoomIn = () => setScale((prev) => Math.min(5, prev + 0.15));
  const zoomOut = () => setScale((prev) => Math.max(0.2, prev - 0.15));
  const rotate90 = () => setRotation((prev) => (prev + 90) % 360);
  const resetTransform = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
  };

  // Crop and export
  const handleCrop = () => {
    if (!imageEl) return;

    const outputH = Math.round(outputWidth / aspectRatio);
    const offscreen = document.createElement('canvas');
    offscreen.width = outputWidth;
    offscreen.height = outputH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Replicate the same transform as preview but at output resolution
    const scaleFactorX = outputWidth / canvasSize.width;
    const scaleFactorY = outputH / canvasSize.height;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, outputWidth, outputH);

    ctx.save();
    ctx.translate(outputWidth / 2 + offsetX * scaleFactorX, outputH / 2 + offsetY * scaleFactorY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const imgAspect = imageEl.width / imageEl.height;
    let drawW, drawH;
    if (imgAspect > aspectRatio) {
      drawH = canvasSize.height;
      drawW = drawH * imgAspect;
    } else {
      drawW = canvasSize.width;
      drawH = drawW / imgAspect;
    }

    // Scale draw dimensions to output
    drawW *= scaleFactorX;
    drawH *= scaleFactorY;

    ctx.drawImage(imageEl, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    offscreen.toBlob(
      (blob) => {
        if (blob) {
          const extension = imageFile.type === 'image/png' ? '.png' : '.jpg';
          const croppedFileName = imageFile.name.replace(/\.[^/.]+$/, '') + '_cropped' + extension;
          const croppedFile = new File([blob], croppedFileName, {
            type: imageFile.type || 'image/jpeg',
          });
          onCropComplete(croppedFile);
        }
      },
      imageFile.type || 'image/jpeg',
      quality
    );
  };

  return (
    <div className="image-crop-overlay" onClick={onCancel}>
      <div className="image-crop-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crop-modal-header">
          <div className="crop-modal-title">
            <FiCrop />
            <span>Crop Image</span>
          </div>
          <button className="crop-close-btn" onClick={onCancel}>
            <FiX />
          </button>
        </div>

        {/* Crop Area */}
        <div className="crop-area" ref={containerRef}>
          <div className="crop-hint">Drag to reposition • Scroll to zoom</div>
          <div
            className="crop-canvas-wrapper"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          >
            <canvas
              ref={canvasRef}
              className="crop-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            />
            {/* Corner brackets overlay */}
            <div className="crop-frame-overlay">
              <div className="crop-corner tl" />
              <div className="crop-corner tr" />
              <div className="crop-corner bl" />
              <div className="crop-corner br" />
              {/* Grid lines */}
              <div className="crop-grid-h1" />
              <div className="crop-grid-h2" />
              <div className="crop-grid-v1" />
              <div className="crop-grid-v2" />
            </div>
          </div>

          {/* Aspect Ratio Label */}
          <div className="crop-aspect-label">
            {aspectWidth}:{aspectHeight} • {outputWidth}px output
          </div>
        </div>

        {/* Controls */}
        <div className="crop-controls">
          <div className="crop-controls-left">
            <button type="button" className="crop-ctrl-btn" onClick={zoomOut} title="Zoom Out">
              <FiZoomOut />
            </button>
            <div className="zoom-slider-wrapper">
              <input
                type="range"
                min="20"
                max="500"
                value={Math.round(scale * 100)}
                onChange={(e) => setScale(parseInt(e.target.value) / 100)}
                className="zoom-slider"
              />
              <span className="zoom-value">{Math.round(scale * 100)}%</span>
            </div>
            <button type="button" className="crop-ctrl-btn" onClick={zoomIn} title="Zoom In">
              <FiZoomIn />
            </button>
            <div className="crop-divider" />
            <button type="button" className="crop-ctrl-btn" onClick={rotate90} title="Rotate 90°">
              <FiRotateCw />
            </button>
            <button type="button" className="crop-ctrl-btn reset-btn" onClick={resetTransform} title="Reset">
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="crop-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCrop}>
            <FiCheck /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;