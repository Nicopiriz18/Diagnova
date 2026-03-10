"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Stethoscope, Loader2, ClipboardList, Zap } from "lucide-react";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import DiagnosticPanel from "./components/DiagnosticPanel";
import ConfidenceEvolutionPanel, { ConfidenceSnapshot } from "./components/ConfidenceEvolutionPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp: string;
  message_metadata?: {
    confidence_score?: number;
    phase?: string;
    final_diagnosis?: boolean;
    info_categories_covered?: Record<string, boolean>;
    symptoms?: string[];
    agent_reasoning?: string;
    patient_info?: Record<string, any>;
  };
}

export default function Page() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<"active" | "completed">("active");
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [diagnosisProgress, setDiagnosisProgress] = useState<string | null>(null);
  const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);
  const [confidenceHistory, setConfidenceHistory] = useState<ConfidenceSnapshot[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    const maxRetries = 3;
    const baseDelayMs = 1000;

    try {
      setLoading(true);
      setError(null);

      let lastError: unknown;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(`${API_URL}/v1/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!response.ok) throw new Error("Error al crear la sesión");

          const data = await response.json();
          setSessionId(data.id);

          const welcomeMessage: Message = {
            id: 0,
            role: "assistant",
            content:
              "¡Hola! Soy Diagnova, tu asistente médico inteligente.\n\nPuedo ayudarte a:\n• Hacer un análisis clínico detallado\n• Analizar imágenes médicas\n• Generar diagnósticos diferenciales\n\n¿Cuál es tu consulta hoy?",
            timestamp: new Date().toISOString(),
          };

          setMessages([welcomeMessage]);
          setShowWelcome(false);
          return;
        } catch (err) {
          lastError = err;
          if (attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)));
          }
        }
      }
      throw lastError;
    } catch (err) {
      setError("No se pudo conectar con el servidor. Verifica que la API esté corriendo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!sessionId) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/v1/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Error al enviar el mensaje");

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.id,
        role: "assistant",
        content: data.content,
        images: data.images,
        timestamp: data.timestamp,
        message_metadata: data.message_metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.message_metadata?.confidence_score !== undefined) {
        setConfidenceHistory((prev) => [
          ...prev,
          {
            turn: prev.length + 1,
            score: data.message_metadata.confidence_score ?? 0,
            categories: data.message_metadata.info_categories_covered ?? {},
            symptoms: data.message_metadata.symptoms ?? [],
            agentReasoning: data.message_metadata.agent_reasoning ?? "",
            patientInfo: data.message_metadata.patient_info ?? {},
          },
        ]);
      }

      if (data.message_metadata?.final_diagnosis) {
        loadDiagnosis();
      }
    } catch (err) {
      setError("Error al comunicarse con el servidor");
      console.error(err);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!sessionId) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/v1/sessions/${sessionId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error al subir la imagen");

      const data = await response.json();

      const userMessage: Message = {
        id: Date.now(),
        role: "user",
        content: "Imagen subida",
        images: [data.url],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        refreshSession();
      }, 1000);
    } catch (err) {
      setError("Error al subir la imagen");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const refreshSession = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_URL}/v1/sessions/${sessionId}`);
      if (!response.ok) return;

      const data = await response.json();

      if (data.messages && data.messages.length > messages.length) {
        const serverMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          images: msg.images,
          timestamp: msg.timestamp,
        }));
        setMessages(serverMessages);
      }
    } catch (err) {
      console.error("Error al refrescar la sesión:", err);
    }
  };

  const loadDiagnosis = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_URL}/v1/sessions/${sessionId}/diagnosis`);
      if (!response.ok) return;

      const data = await response.json();
      setDiagnostic(data.assessment);
      setSessionStatus("completed");
    } catch (err) {
      console.error("Error al cargar diagnóstico:", err);
    }
  };

  const forceDiagnosis = async () => {
    if (!sessionId) return;

    if (!confirm("¿Estás seguro de que quieres finalizar la consulta y obtener el diagnóstico?")) {
      return;
    }

    setIsGeneratingDiagnosis(true);
    setDiagnosisProgress("Iniciando análisis diagnóstico...");
    setError(null);

    try {
      const eventSource = new EventSource(`${API_URL}/v1/sessions/${sessionId}/finalize`);

      eventSource.addEventListener("progress", (event) => {
        const data = JSON.parse(event.data);
        setDiagnosisProgress(data.message);
      });

      eventSource.addEventListener("complete", (event) => {
        const data = JSON.parse(event.data);
        setDiagnostic(data.assessment);
        setSessionStatus("completed");
        setDiagnosisProgress(null);
        setIsGeneratingDiagnosis(false);

        const diagMessage: Message = {
          id: Date.now(),
          role: "assistant",
          content: "He generado la evaluación diagnóstica completa. Revisa el panel a continuación con todos los detalles.",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, diagMessage]);
        eventSource.close();
      });

      eventSource.addEventListener("error", (event) => {
        console.error("SSE Error:", event);
        setError("Error al generar el diagnóstico");
        setDiagnosisProgress(null);
        setIsGeneratingDiagnosis(false);
        eventSource.close();
      });
    } catch (err) {
      setError("Error al generar el diagnóstico");
      console.error(err);
      setDiagnosisProgress(null);
      setIsGeneratingDiagnosis(false);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setDiagnostic(null);
    setSessionStatus("active");
    setError(null);
    setShowWelcome(true);
    setConfidenceHistory([]);
    createSession();
  };

  const quickActions = [
    "Tengo dolor de cabeza intenso desde hace 2 días",
    "Me duele el pecho cuando respiro profundo",
    "Tengo fiebre alta y dolor de garganta",
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-3.5 z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-none">Diagnova</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sistema de agentes con RAG e análisis de imágenes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionId && (
              <Badge
                variant={sessionStatus === "active" ? "success" : "info"}
                className="text-xs"
              >
                {sessionStatus === "active" ? "Sesión activa" : "Completada"}
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={startNewSession}
              className="gap-2 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nueva consulta
            </Button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="shrink-0 bg-destructive/10 border-b border-destructive/20 px-6 py-2.5">
          <p className="text-sm text-destructive font-medium text-center">{error}</p>
        </div>
      )}

      {/* Main area: chat + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable chat area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-1">
              {/* Initial loading */}
              {loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Iniciando sesión...</p>
                </div>
              )}

              {/* Quick action chips */}
              {showWelcome && messages.length <= 1 && sessionId && (
                <div className="rounded-xl border border-border bg-card/60 p-4 mb-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Consultas frecuentes
                  </p>
                  <div className="flex flex-col gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(action)}
                        disabled={loading}
                        className="text-left px-3.5 py-2.5 rounded-lg border border-border bg-background/60 text-sm text-foreground hover:bg-accent hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  images={msg.images}
                  timestamp={msg.timestamp}
                />
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-center gap-3 py-2 animate-fade-in">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1 items-center">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce-dot"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce-dot"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce-dot"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Force diagnosis prompt */}
              {sessionId && messages.length > 2 && sessionStatus === "active" && !diagnostic && !isGeneratingDiagnosis && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4 text-center animate-fade-in">
                  <p className="text-sm text-muted-foreground mb-3">
                    ¿Ya tienes suficiente información para generar el diagnóstico?
                  </p>
                  <Button
                    onClick={forceDiagnosis}
                    disabled={isGeneratingDiagnosis}
                    size="sm"
                    className="gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Generar Diagnóstico Completo
                  </Button>
                </div>
              )}

              {/* Diagnosis generation progress */}
              {isGeneratingDiagnosis && diagnosisProgress && (
                <div className="rounded-xl border border-primary/30 bg-card p-5 mt-4 animate-fade-in">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="shrink-0 w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Análisis Clínico en Progreso</p>
                      <p className="text-xs text-muted-foreground mt-0.5 italic truncate">
                        {diagnosisProgress}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-blue-400 animate-progress-bar" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Este proceso puede tomar entre 10–15 segundos...
                  </p>
                </div>
              )}

              {/* Diagnostic panel */}
              {diagnostic && <DiagnosticPanel assessment={diagnostic} />}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          {sessionId && sessionStatus === "active" && !diagnostic && (
            <ChatInput
              onSendMessage={sendMessage}
              onUploadImage={uploadImage}
              disabled={loading || typing}
              uploading={uploading}
            />
          )}
        </div>

        {/* Right: confidence sidebar */}
        {sessionStatus === "active" && !diagnostic && confidenceHistory.length > 0 && (
          <ConfidenceEvolutionPanel history={confidenceHistory} />
        )}
      </div>
    </div>
  );
}
