import { User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp: string;
}

export default function ChatMessage({ role, content, images, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "flex mb-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[72%] min-w-[180px]", isUser && "items-end")}>
        {/* Avatar + name */}
        <div
          className={cn(
            "flex items-center gap-2 mb-1.5",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
              isUser
                ? "bg-primary/20 border border-primary/30"
                : "bg-emerald-500/10 border border-emerald-500/20"
            )}
          >
            {isUser ? (
              <User className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {isUser ? "Tú" : "Diagnova"}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-sm"
              : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm shadow-sm"
          )}
        >
          {content}
        </div>

        {/* Images */}
        {images && images.length > 0 && (
          <div className={cn("mt-2 flex flex-wrap gap-2", isUser && "justify-end")}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Imagen ${idx + 1}`}
                className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(img, "_blank")}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "text-[11px] text-muted-foreground mt-1",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
}
