"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, Move } from "lucide-react";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number;
}

export function ImageCropper({
  imageSrc,
  open,
  onClose,
  onCropComplete,
  aspectRatio = 4 / 3,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      // Only set crossOrigin for non-blob URLs (external images)
      if (!url.startsWith("blob:") && !url.startsWith("data:")) {
        image.crossOrigin = "anonymous";
      }
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
  ): Promise<Blob> => {
    // Convert blob URL to data URL to avoid CORS issues
    let imageUrl = imageSrc;
    if (imageSrc.startsWith("blob:")) {
      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn("Failed to convert blob to data URL, using original:", error);
        // Fall back to original URL
      }
    }

    const image = await createImage(imageUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    if (!croppedCtx) {
      throw new Error("No 2d context");
    }

    // Set the size of the cropped canvas
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped image onto the new canvas
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // As a blob
    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/jpeg");
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust Mission Image</DialogTitle>
          <DialogDescription>
            Crop, zoom, and rotate your image to get the perfect thumbnail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={onRotationChange}
              onCropComplete={onCropCompleteCallback}
              cropShape="rect"
              showGrid={true}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <RotateCw className="h-4 w-4" />
                Rotation
              </div>
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={(value) => setRotation(value[0])}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {rotation}°
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Move className="h-4 w-4" />
                Position
              </div>
              <p className="text-xs text-muted-foreground">
                Drag the image to adjust its position within the crop area.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={processing || !croppedAreaPixels}>
            {processing ? "Processing..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

