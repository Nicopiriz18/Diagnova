import { useState, useRef, KeyboardEvent } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadImage: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
}

export default function ChatInput({
  onSendMessage,
  onUploadImage,
  disabled,
  uploading,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isDisabled = disabled || uploading;
  const canSend = message.trim().length > 0 && !isDisabled;

  return (
    <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur-sm px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary/50 transition-colors">
          {/* Attach image button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Adjuntar imagen"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isDisabled ? "Esperando respuesta..." : "Escribe tu mensaje... (Shift+Enter para nueva línea)"
            }
            disabled={isDisabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[32px] max-h-[120px] leading-relaxed py-0.5",
              isDisabled && "cursor-not-allowed opacity-60"
            )}
          />

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 h-8 w-8 rounded-xl"
            title="Enviar"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-2 text-center">
          Diagnova es un asistente de apoyo clínico — no reemplaza el criterio médico profesional.
        </p>
      </div>
    </div>
  );
}
