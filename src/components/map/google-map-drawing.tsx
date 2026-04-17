"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "~/components/shadcn/ui/button";
import { Card } from "~/components/shadcn/ui/card";
import { Square, Circle, Pen, X } from "lucide-react";

type DrawingMode = "polygon" | "rectangle" | "circle";

interface GoogleMapDrawingProps {
  onSelectionChange?: (
    feature: GeoJSON.Feature | null,
    activeMode: DrawingMode,
  ) => void;
  onClose?: () => void;
  mapElement?: HTMLElement | null;
  map?: google.maps.Map | null;
}

interface Point {
  lat: number;
  lng: number;
  x: number;
  y: number;
}

const getRectangleCorners = (p1: Point, p2: Point): Point[] => {
  return [
    { ...p1 },
    { lat: p1.lat, lng: p2.lng, x: p2.x, y: p1.y },
    { ...p2 },
    { lat: p2.lat, lng: p1.lng, x: p1.x, y: p2.y },
  ];
};

const getModeInstructions = (mode: DrawingMode, pointCount: number): string => {
  if (!mode) return "Select a drawing tool to begin";
  if (mode === "polygon")
    return pointCount === 0
      ? "Click to add points"
      : "Click to add more points, double-click to finish";
  if (mode === "rectangle")
    return pointCount === 0
      ? "Click top-left corner"
      : "Click bottom-right corner";
  if (mode === "circle")
    return pointCount === 0 ? "Click center point" : "Click edge to set radius";
  return "";
};

function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildCircleFeature(center: Point, edgePoint: Point): GeoJSON.Feature {
  const radiusMetres = haversineMetres(
    center.lat,
    center.lng,
    edgePoint.lat,
    edgePoint.lng,
  );

  const R = 6_371_000;
  const radiusDegLat = (radiusMetres / R) * (180 / Math.PI);
  const radiusDegLng = radiusDegLat / Math.cos((center.lat * Math.PI) / 180);

  const coords: [number, number][] = [];
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * 2 * Math.PI;
    coords.push([
      center.lat + radiusDegLat * Math.sin(angle),
      center.lng + radiusDegLng * Math.cos(angle),
    ]);
  }
  coords.push([...coords[0]!]);

  return {
    type: "Feature",
    properties: {
      center: [center.lat, center.lng] as [number, number],
      radiusMetres,
    },
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

export function GoogleMapDrawing({
  onSelectionChange,
  mapElement,
  onClose,
  map,
}: GoogleMapDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeMode, setActiveMode] = useState<DrawingMode>("polygon");
  const [points, setPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [currentFeature, setCurrentFeature] = useState<GeoJSON.Feature | null>(
    null,
  );

  const canvasCoordsToLatlng = useCallback(
    (x: number, y: number): { lat: number; lng: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas || !map) return null;

      const bounds = map.getBounds();
      if (!bounds) return null;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const rect = canvas.getBoundingClientRect();
      const lng = sw.lng() + (x / rect.width) * (ne.lng() - sw.lng());
      const lat = ne.lat() - (y / rect.height) * (ne.lat() - sw.lat());

      return { lat, lng };
    },
    [map],
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length > 0) {
      ctx.fillStyle = "rgba(65, 189, 40, 0.3)";
      ctx.strokeStyle = "rgb(65, 189, 40)";
      ctx.lineWidth = 2;

      if (activeMode === "polygon") {
        const firstPoint = points[0];
        if (firstPoint) {
          ctx.beginPath();
          ctx.moveTo(firstPoint.x, firstPoint.y);
          for (let i = 1; i < points.length; i++) {
            const p = points[i];
            if (p) ctx.lineTo(p.x, p.y);
          }
          if (mousePos && points.length > 1) ctx.lineTo(mousePos.x, mousePos.y);
          if (points.length > 2) ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (activeMode === "rectangle") {
        const second = points.length === 2 ? points[1]! : mousePos;
        if (points[0] && second) {
          const corners = getRectangleCorners(points[0], second);
          ctx.beginPath();
          ctx.moveTo(corners[0]!.x, corners[0]!.y);
          for (let i = 1; i < corners.length; i++)
            ctx.lineTo(corners[i]!.x, corners[i]!.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (activeMode === "circle") {
        const startPoint = points[0];
        if (startPoint) {
          const edgePoint =
            points.length > 1 ? points[points.length - 1]! : mousePos;
          if (edgePoint) {
            const radius = Math.sqrt(
              (edgePoint.x - startPoint.x) ** 2 +
                (edgePoint.y - startPoint.y) ** 2,
            );
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.lineWidth = 2;
      for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = "rgb(0, 0, 0)";
      for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [points, activeMode, mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapElement) return;
    const rect = mapElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const observer = new ResizeObserver(() => {
      const newRect = mapElement.getBoundingClientRect();
      canvas.width = newRect.width;
      canvas.height = newRect.height;
      redrawCanvas();
    });
    observer.observe(mapElement);
    return () => observer.disconnect();
  }, [mapElement, redrawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const latlng = canvasCoordsToLatlng(x, y);
    if (!latlng) return;
    const newPoint: Point = { ...latlng, x, y };

    if (activeMode === "polygon") {
      setPoints((prev) => [...prev, newPoint]);
    } else if (activeMode === "rectangle") {
      setPoints((prev) => (prev.length < 2 ? [...prev, newPoint] : [newPoint]));
    } else if (activeMode === "circle") {
      setPoints((prev) =>
        prev.length === 0 ? [newPoint] : [...prev, newPoint],
      );
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeMode || points.length === 0) {
      setMousePos(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const latlng = canvasCoordsToLatlng(x, y);
    if (latlng) setMousePos({ ...latlng, x, y });
  };

  const handleCanvasMouseLeave = () => setMousePos(null);

  useEffect(() => {
    redrawCanvas();

    let feature: GeoJSON.Feature | null = null;

    if (activeMode === "rectangle" && points.length === 2) {
      const corners = getRectangleCorners(points[0]!, points[1]!);
      const coords = corners.map((p) => [p.lat, p.lng] as [number, number]);
      coords.push([...coords[0]!]);
      feature = {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [coords] },
      };
    } else if (activeMode === "polygon" && points.length > 2) {
      const coords = points.map((p) => [p.lat, p.lng] as [number, number]);
      coords.push([...coords[0]!]);
      feature = {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [coords] },
      };
    } else if (activeMode === "circle" && points.length > 1) {
      feature = buildCircleFeature(points[0]!, points[points.length - 1]!);
    }

    setCurrentFeature(feature);
  }, [points, activeMode, redrawCanvas]);

  const handleClear = () => {
    setPoints([]);
    setActiveMode("polygon");
    setCurrentFeature(null);
  };

  const handleClose = () => {
    onClose?.();
    handleClear();
  };

  const content = (
    <>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        className="absolute inset-0 z-20"
        style={{ cursor: activeMode ? "crosshair" : "default" }}
      />

      <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
        <Card>
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-900">
                Drawing Tools
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-center text-xs text-gray-500">
              {getModeInstructions(activeMode, points.length)}
            </p>

            <div className="flex flex-col items-center justify-center gap-2">
              <Button
                onClick={() => {
                  setActiveMode("polygon");
                  setPoints([]);
                }}
                variant={activeMode === "polygon" ? "default" : "outline"}
                className="w-full gap-2"
                size="sm"
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  setActiveMode("rectangle");
                  setPoints([]);
                }}
                variant={activeMode === "rectangle" ? "default" : "outline"}
                className="w-full gap-2"
                size="sm"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  setActiveMode("circle");
                  setPoints([]);
                }}
                variant={activeMode === "circle" ? "default" : "outline"}
                className="w-full gap-2"
                size="sm"
              >
                <Circle className="h-4 w-4" />
              </Button>

              {points.length > 0 && (
                <Button
                  onClick={handleClear}
                  variant="destructive"
                  className="w-full gap-2"
                  size="sm"
                >
                  Clear
                </Button>
              )}

              {currentFeature && (
                <Button
                  onClick={() => {
                    onSelectionChange?.(currentFeature, activeMode);
                    console.log("Final GeoJSON Feature:", currentFeature);
                    setActiveMode("polygon");
                  }}
                  variant="secondary"
                  className="w-full gap-2"
                  size="sm"
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );

  if (mapElement) {
    return createPortal(content, mapElement);
  }

  return content;
}
