import { Loader2, X } from "lucide-react";

interface ImagePreviewProps {
  url: string;
  analyzing?: boolean;
  onClose?: () => void;
}

export default function ImagePreview({ url, analyzing, onClose }: ImagePreviewProps) {
  return (
    <div className="relative inline-block mt-2">
      <div className="relative rounded-xl overflow-hidden border border-border bg-card">
        <img
          src={url}
          alt="Imagen subida"
          className="block max-w-[300px] max-h-[300px] object-contain"
        />

        {analyzing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="text-white text-xs font-semibold">Analizando imagen...</span>
          </div>
        )}
      </div>

      {onClose && !analyzing && (
        <button
          onClick={onClose}
          title="Eliminar"
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
