import { useEffect, useRef, useState } from "react";

interface ScratchCardProps {
  width?: number;
  height?: number;
  brushSize?: number;
  threshold?: number; // percent (0-100) scratched to auto-clear
  className?: string;
  children: React.ReactNode; // content beneath the scratch layer
}

// Lightweight scratch card using a canvas overlay.
// Renders children beneath, and a canvas on top that user can "erase" by scratching.
export default function ScratchCard({
  width = 320,
  height = 160,
  brushSize = 24,
  threshold = 55,
  className,
  children,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match container size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw opaque overlay (so coupon is hidden until scratched)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(32, 28, 24, 0.98)");
    gradient.addColorStop(1, "rgba(10, 9, 8, 0.98)");

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a very subtle texture on top (still opaque overall)
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.fillRect(i, 0, 5, canvas.height);
    }
  }, []);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isCleared) return;
    setIsDrawing(true);
    const { x, y } = getPointerPos(e);
    scratchAt(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isCleared) return;
    const { x, y } = getPointerPos(e);
    scratchAt(x, y);
  };

  const handlePointerUp = () => {
    if (isCleared) return;
    setIsDrawing(false);
    // Evaluate scratched area
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let cleared = 0;
    // Count fully transparent pixels
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) cleared++;
    }
    const clearedPercent = (cleared / (canvas.width * canvas.height)) * 100;
    if (clearedPercent >= threshold) {
      // Clear completely
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsCleared(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: `${width}px`, height: `${height}px`, position: "relative" }}
    >
      <div className="w-full h-full absolute inset-0 rounded-xl overflow-hidden gradient-card flex items-center justify-center">
        {children}
      </div>
      {!isCleared && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-xl cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />)
      }
    </div>
  );
}
