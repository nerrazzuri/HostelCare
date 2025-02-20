import { useCallback, useState } from "react";
import { Button } from "./button";
import { ImagePlus, X } from "lucide-react";

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  value?: string[];
}

export function ImageUpload({ onChange, maxFiles = 3, value }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(value || []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length + previews.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} images`);
        return;
      }

      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      onChange(files);
    },
    [maxFiles, onChange, previews.length]
  );

  const removeImage = useCallback(
    (index: number) => {
      setPreviews(prev => prev.filter((_, i) => i !== index));
      // Notify parent that an image was removed
      onChange([]);
    },
    [onChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {previews.map((preview, index) => (
          <div key={preview} className="relative aspect-square">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 p-1 bg-background border rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {previews.length < maxFiles && (
          <Button
            variant="outline"
            className="relative aspect-square"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <ImagePlus className="h-6 w-6" />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Upload up to {maxFiles} images (PNG, JPG up to 5MB each)
      </p>
    </div>
  );
}
