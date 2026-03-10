"use client";

import { Brain, CheckCircle2, Circle, TrendingUp, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ConfidenceSnapshot {
  turn: number;
  score: number;
  categories: Record<string, boolean>;
  symptoms: string[];
  agentReasoning?: string;
  patientInfo?: Record<string, any>;
}

interface Props {
  history: ConfidenceSnapshot[];
}

const CATEGORY_LABELS: Record<string, string> = {
  chief_complaint: "Motivo de consulta",
  symptom_onset: "Inicio de síntomas",
  symptom_duration: "Duración",
  symptom_progression: "Progresión",
  severity: "Severidad",
  associated_symptoms: "Síntomas asociados",
  medical_history: "Antecedentes",
  medications: "Medicamentos",
  allergies: "Alergias",
  social_history: "Historia social",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

const PATIENT_INFO_LABELS: Record<string, string> = {
  age: "Edad",
  sex: "Sexo",
  edad: "Edad",
  sexo: "Sexo",
  weight: "Peso",
  height: "Talla",
  occupation: "Ocupación",
  medical_history: "Antecedentes",
};

function formatPatientValue(key: string, value: any): string {
  if (key === "sex" || key === "sexo") {
    if (value === "M" || value === "male" || value === "masculino") return "Masculino";
    if (value === "F" || value === "female" || value === "femenino") return "Femenino";
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function getScoreVariant(score: number): "success" | "warning" | "secondary" {
  if (score >= 0.7) return "success";
  if (score >= 0.4) return "warning";
  return "secondary";
}

function Sparkline({ history }: { history: ConfidenceSnapshot[] }) {
  const W = 240;
  const H = 52;
  const PAD = { top: 6, right: 18, bottom: 14, left: 20 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (history.length < 2) {
    return (
      <p className="text-[11px] text-muted-foreground italic text-center py-3">
        Esperando más turnos…
      </p>
    );
  }

  const xStep = innerW / Math.max(history.length - 1, 1);
  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (score: number) => PAD.top + innerH - score * innerH;
  const points = history.map((h, i) => `${toX(i)},${toY(h.score)}`).join(" ");
  const threshold70Y = toY(0.7);

  return (
    <svg width={W} height={H} className="overflow-visible block">
      <defs>
        <linearGradient id="sparkGradFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((v) => (
        <line
          key={v}
          x1={PAD.left}
          y1={toY(v)}
          x2={PAD.left + innerW}
          y2={toY(v)}
          stroke="hsl(240 4% 20%)"
          strokeWidth={1}
        />
      ))}

      {[0, 0.5, 1].map((v) => (
        <text
          key={v}
          x={PAD.left - 4}
          y={toY(v) + 3}
          textAnchor="end"
          fontSize={9}
          fill="hsl(240 5% 55%)"
        >
          {Math.round(v * 100)}
        </text>
      ))}

      <line
        x1={PAD.left}
        y1={threshold70Y}
        x2={PAD.left + innerW}
        y2={threshold70Y}
        stroke="#22c55e"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <text
        x={PAD.left + innerW + 2}
        y={threshold70Y + 3}
        fontSize={8}
        fill="#22c55e"
        opacity={0.7}
      >
        70%
      </text>

      <polygon
        points={[
          `${toX(0)},${toY(0)}`,
          ...history.map((h, i) => `${toX(i)},${toY(h.score)}`),
          `${toX(history.length - 1)},${toY(0)}`,
        ].join(" ")}
        fill="url(#sparkGradFill)"
      />

      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {history.map((h, i) => (
        <circle
          key={i}
          cx={toX(i)}
          cy={toY(h.score)}
          r={i === history.length - 1 ? 3 : 2}
          fill={i === history.length - 1 ? "#3b82f6" : "hsl(240 6% 10%)"}
          stroke="#3b82f6"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

export default function ConfidenceEvolutionPanel({ history }: Props) {
  if (history.length === 0) return null;

  const latest = history[history.length - 1];
  const scorePercent = Math.round(latest.score * 100);
  const coveredCount = CATEGORY_ORDER.filter((k) => latest.categories[k]).length;
  const scoreVariant = getScoreVariant(latest.score);

  const patientEntries = Object.entries(latest.patientInfo ?? {}).filter(
    ([, v]) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0)
  );

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Razonamiento en tiempo real
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Turno {latest.turn} · {coveredCount}/{CATEGORY_ORDER.length} categorías
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Confidence score */}
        <div
          className={cn(
            "rounded-lg border p-3 transition-colors",
            scoreVariant === "success"
              ? "bg-emerald-500/10 border-emerald-500/20"
              : scoreVariant === "warning"
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-secondary border-border"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Confianza diagnóstica</p>
            <span
              className={cn(
                "text-2xl font-bold leading-none",
                scoreVariant === "success"
                  ? "text-emerald-400"
                  : scoreVariant === "warning"
                  ? "text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {scorePercent}%
            </span>
          </div>
          <Progress
            value={scorePercent}
            className={cn(
              "h-1.5",
              scoreVariant === "success"
                ? "[&>div]:bg-emerald-500"
                : scoreVariant === "warning"
                ? "[&>div]:bg-amber-500"
                : ""
            )}
          />
          {latest.score >= 0.7 && (
            <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">
              Listo para diagnóstico
            </p>
          )}
        </div>

        {/* Agent reasoning */}
        {latest.agentReasoning ? (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Pensamiento clínico
              </p>
            </div>
            <p className="text-[11px] text-blue-200/80 leading-relaxed italic">
              {latest.agentReasoning}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-3 text-center">
            <p className="text-[11px] text-muted-foreground italic">
              El razonamiento aparecerá en el siguiente turno…
            </p>
          </div>
        )}

        {/* Patient demographics */}
        {patientEntries.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Datos del paciente
            </p>
            <div className="flex flex-wrap gap-1.5">
              {patientEntries.map(([key, value]) => {
                const label = PATIENT_INFO_LABELS[key] ?? key;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-[11px]"
                  >
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="text-foreground font-medium">
                      {formatPatientValue(key, value)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Category checklist */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
            Categorías
          </p>
          <div className="space-y-2">
            {CATEGORY_ORDER.map((key) => {
              const covered = !!latest.categories[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  {covered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 transition-colors" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-[11px] leading-none transition-colors",
                      covered ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {CATEGORY_LABELS[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Sparkline */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Evolución
          </p>
          <Sparkline history={history} />
        </div>

        {/* Symptom chips */}
        {latest.symptoms.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Síntomas detectados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {latest.symptoms.map((symptom, i) => (
                <Badge key={i} variant="info" className="text-[10px] py-0">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
