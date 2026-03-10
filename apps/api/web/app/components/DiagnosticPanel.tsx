import { useState } from "react";
import {
  ClipboardList,
  Target,
  AlertTriangle,
  CheckSquare,
  FileText,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Dna,
  User,
  TrendingUp,
  CheckCircle,
  XCircle,
  FlaskConical,
  Pill,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DifferentialDx {
  name: string;
  likelihood: number;
  reasoning: string;
  urgency: "immediate" | "urgent" | "routine";
  general_causes?: string[];
  patient_specific_factors?: string[];
  risk_factors?: string[];
  supporting_findings?: string[];
  contradicting_findings?: string[];
  prognosis?: string;
  complications?: string[];
  recommended_tests?: string[];
  treatment_summary?: string;
}

interface DiagnosticPanelProps {
  assessment: any;
}

const urgencyConfig = {
  immediate: { label: "INMEDIATO", variant: "danger" as const },
  urgent: { label: "URGENTE", variant: "warning" as const },
  routine: { label: "RUTINA", variant: "success" as const },
};

const severityConfig = {
  critical: {
    label: "CRÍTICO",
    variant: "danger" as const,
    border: "border-l-red-500",
    bg: "bg-red-500/5",
  },
  warning: {
    label: "ADVERTENCIA",
    variant: "warning" as const,
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
  },
  info: {
    label: "INFO",
    variant: "info" as const,
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
  },
};

const priorityConfig = {
  immediate: {
    label: "INMEDIATO",
    border: "border-l-red-500",
    bg: "bg-red-500/5",
  },
  urgent: {
    label: "URGENTE",
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
  },
  routine: {
    label: "RUTINA",
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
  },
};

function DetailList({
  icon: Icon,
  title,
  items,
  colorClass,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  colorClass: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h5 className={cn("text-xs font-semibold flex items-center gap-1.5 mb-2", colorClass)}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h5>
      <ul className="space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground leading-relaxed list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  section,
  expanded,
  onToggle,
  iconColorClass,
}: {
  icon: React.ElementType;
  title: string;
  section: string;
  expanded: boolean;
  onToggle: () => void;
  iconColorClass?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/40 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn("w-4 h-4", iconColorClass ?? "text-muted-foreground")} />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

export default function DiagnosticPanel({ assessment }: DiagnosticPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    differentials: true,
    redFlags: true,
    actionPlan: false,
    soap: false,
    missing: false,
  });
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});

  const toggleSection = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const toggleDetails = (index: number) =>
    setExpandedDetails((prev) => ({ ...prev, [index]: !prev[index] }));

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mt-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 shrink-0">
          <ClipboardList className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground leading-none">
            Evaluación Diagnóstica Completa
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Análisis generado por el sistema de agentes
          </p>
        </div>
      </div>

      {/* Patient Summary */}
      {assessment.patient_summary && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5" />
            Resumen del Paciente
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{assessment.patient_summary}</p>
        </div>
      )}

      {/* Differentials */}
      {assessment.differentials?.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <SectionHeader
            icon={Target}
            title="Diagnósticos Diferenciales"
            section="differentials"
            expanded={expandedSections.differentials}
            onToggle={() => toggleSection("differentials")}
            iconColorClass="text-primary"
          />
          {expandedSections.differentials && (
            <div className="p-4 border-t border-border space-y-3">
              {assessment.differentials.map((dx: DifferentialDx, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-background/60 overflow-hidden"
                >
                  {/* Dx header */}
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {idx + 1}. {dx.name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {dx.reasoning}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={urgencyConfig[dx.urgency]?.variant ?? "secondary"} className="text-[10px]">
                        {urgencyConfig[dx.urgency]?.label ?? dx.urgency}
                      </Badge>
                      <span className="text-sm font-bold text-primary">{dx.likelihood}%</span>
                    </div>
                  </div>

                  {/* Likelihood bar */}
                  <div className="px-4 pb-3">
                    <Progress value={dx.likelihood} className="h-1" />
                  </div>

                  {/* Toggle details */}
                  <button
                    onClick={() => toggleDetails(idx)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    {expandedDetails[idx] ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Ocultar detalles
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Ver detalles completos
                      </>
                    )}
                  </button>

                  {/* Expanded details */}
                  {expandedDetails[idx] && (
                    <div className="p-4 border-t border-border space-y-4">
                      <DetailList
                        icon={Dna}
                        title="Causas Generales"
                        items={dx.general_causes ?? []}
                        colorClass="text-violet-400"
                      />
                      <DetailList
                        icon={User}
                        title="Factores Específicos del Paciente"
                        items={dx.patient_specific_factors ?? []}
                        colorClass="text-emerald-400"
                      />
                      <DetailList
                        icon={ShieldAlert}
                        title="Factores de Riesgo"
                        items={dx.risk_factors ?? []}
                        colorClass="text-red-400"
                      />
                      <DetailList
                        icon={CheckCircle}
                        title="Hallazgos que Apoyan"
                        items={dx.supporting_findings ?? []}
                        colorClass="text-emerald-400"
                      />
                      <DetailList
                        icon={XCircle}
                        title="Hallazgos que Contradicen"
                        items={dx.contradicting_findings ?? []}
                        colorClass="text-orange-400"
                      />
                      {dx.prognosis && (
                        <div>
                          <h5 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Pronóstico
                          </h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">{dx.prognosis}</p>
                        </div>
                      )}
                      <DetailList
                        icon={AlertTriangle}
                        title="Complicaciones Potenciales"
                        items={dx.complications ?? []}
                        colorClass="text-red-400"
                      />
                      <DetailList
                        icon={FlaskConical}
                        title="Exámenes Recomendados"
                        items={dx.recommended_tests ?? []}
                        colorClass="text-violet-400"
                      />
                      {dx.treatment_summary && (
                        <div>
                          <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                            <Pill className="w-3.5 h-3.5" />
                            Opciones de Tratamiento
                          </h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">{dx.treatment_summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Red Flags */}
      {assessment.red_flags?.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <SectionHeader
            icon={AlertTriangle}
            title="Señales de Alerta"
            section="redFlags"
            expanded={expandedSections.redFlags}
            onToggle={() => toggleSection("redFlags")}
            iconColorClass="text-red-400"
          />
          {expandedSections.redFlags && (
            <div className="p-4 border-t border-border space-y-2.5">
              {assessment.red_flags.map((flag: any, idx: number) => {
                const cfg = severityConfig[flag.severity as keyof typeof severityConfig] ?? severityConfig.info;
                return (
                  <div
                    key={idx}
                    className={cn("border-l-2 rounded-r-lg px-4 py-3", cfg.border, cfg.bg)}
                  >
                    <Badge variant={cfg.variant} className="text-[10px] mb-2">
                      {cfg.label}
                    </Badge>
                    <p className="text-sm font-medium text-foreground">{flag.message}</p>
                    {flag.why_it_matters && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {flag.why_it_matters}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Action Plan */}
      {assessment.action_plan?.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <SectionHeader
            icon={CheckSquare}
            title="Plan de Acción"
            section="actionPlan"
            expanded={expandedSections.actionPlan}
            onToggle={() => toggleSection("actionPlan")}
            iconColorClass="text-emerald-400"
          />
          {expandedSections.actionPlan && (
            <div className="p-4 border-t border-border space-y-2.5">
              {assessment.action_plan.map((item: any, idx: number) => {
                const cfg = priorityConfig[item.priority as keyof typeof priorityConfig] ?? priorityConfig.routine;
                return (
                  <div
                    key={idx}
                    className={cn("border-l-2 rounded-r-lg px-4 py-3", cfg.border, cfg.bg)}
                  >
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                      {cfg.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    {item.rationale && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        <em>Justificación:</em> {item.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SOAP Note */}
      {assessment.soap && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <SectionHeader
            icon={FileText}
            title="Nota SOAP"
            section="soap"
            expanded={expandedSections.soap}
            onToggle={() => toggleSection("soap")}
            iconColorClass="text-blue-400"
          />
          {expandedSections.soap && (
            <div className="p-4 border-t border-border space-y-4">
              {(["subjective", "objective", "assessment", "plan"] as const).map((key) => {
                const labels: Record<string, string> = {
                  subjective: "SUBJETIVO",
                  objective: "OBJETIVO",
                  assessment: "EVALUACIÓN",
                  plan: "PLAN",
                };
                return assessment.soap[key] ? (
                  <div key={key}>
                    <p className="text-xs font-bold text-primary mb-1.5">{labels[key]}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {assessment.soap[key]}
                    </p>
                    {key !== "plan" && <Separator className="mt-4" />}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Missing info */}
      {assessment.missing_questions?.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <SectionHeader
            icon={HelpCircle}
            title="Información Adicional Recomendada"
            section="missing"
            expanded={expandedSections.missing}
            onToggle={() => toggleSection("missing")}
            iconColorClass="text-muted-foreground"
          />
          {expandedSections.missing && (
            <ul className="p-4 border-t border-border space-y-2 pl-8">
              {assessment.missing_questions.map((q: string, idx: number) => (
                <li key={idx} className="text-sm text-muted-foreground leading-relaxed list-disc">
                  {q}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Limitations */}
      {assessment.limitations && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <h3 className="text-xs font-semibold text-destructive flex items-center gap-1.5 mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Limitaciones del Análisis
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{assessment.limitations}</p>
        </div>
      )}
    </div>
  );
}
