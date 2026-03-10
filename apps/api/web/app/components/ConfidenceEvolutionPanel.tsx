"use client";

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
  chief_complaint:     "Motivo de consulta",
  symptom_onset:       "Inicio de síntomas",
  symptom_duration:    "Duración",
  symptom_progression: "Progresión",
  severity:            "Severidad",
  associated_symptoms: "Síntomas asociados",
  medical_history:     "Antecedentes",
  medications:         "Medicamentos",
  allergies:           "Alergias",
  social_history:      "Historia social",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

const PATIENT_INFO_LABELS: Record<string, string> = {
  age:            "Edad",
  sex:            "Sexo",
  edad:           "Edad",
  sexo:           "Sexo",
  weight:         "Peso",
  height:         "Talla",
  occupation:     "Ocupación",
  medical_history:"Antecedentes",
};

function getScoreColor(score: number): string {
  if (score >= 0.7) return "#16a34a";
  if (score >= 0.4) return "#d97706";
  return "#6b7280";
}

function getScoreBg(score: number): string {
  if (score >= 0.7) return "#dcfce7";
  if (score >= 0.4) return "#fef3c7";
  return "#f3f4f6";
}

function getScoreBorder(score: number): string {
  if (score >= 0.7) return "#bbf7d0";
  if (score >= 0.4) return "#fde68a";
  return "#e5e7eb";
}

function formatPatientValue(key: string, value: any): string {
  if (key === "sex" || key === "sexo") {
    if (value === "M" || value === "male" || value === "masculino") return "Masculino";
    if (value === "F" || value === "female" || value === "femenino") return "Femenino";
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function Sparkline({ history }: { history: ConfidenceSnapshot[] }) {
  const W = 252;
  const H = 52;
  const PAD = { top: 6, right: 20, bottom: 14, left: 22 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (history.length < 2) {
    return (
      <div style={{
        height: H,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        fontSize: 11,
        fontStyle: "italic"
      }}>
        Esperando más turnos…
      </div>
    );
  }

  const xStep = innerW / Math.max(history.length - 1, 1);
  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (score: number) => PAD.top + innerH - score * innerH;

  const points = history.map((h, i) => `${toX(i)},${toY(h.score)}`).join(" ");
  const threshold70Y = toY(0.7);

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map(v => (
        <line
          key={v}
          x1={PAD.left} y1={toY(v)}
          x2={PAD.left + innerW} y2={toY(v)}
          stroke="#f3f4f6" strokeWidth={1}
        />
      ))}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map(v => (
        <text key={v} x={PAD.left - 4} y={toY(v) + 3} textAnchor="end" fontSize={9} fill="#9ca3af">
          {Math.round(v * 100)}
        </text>
      ))}

      {/* 70% threshold dashed line */}
      <line
        x1={PAD.left} y1={threshold70Y}
        x2={PAD.left + innerW} y2={threshold70Y}
        stroke="#16a34a" strokeWidth={1}
        strokeDasharray="3 3" opacity={0.5}
      />
      <text x={PAD.left + innerW + 2} y={threshold70Y + 3} fontSize={8} fill="#16a34a" opacity={0.7}>
        70%
      </text>

      {/* Gradient fill */}
      <defs>
        <linearGradient id="sparkGradFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={[
          `${toX(0)},${toY(0)}`,
          ...history.map((h, i) => `${toX(i)},${toY(h.score)}`),
          `${toX(history.length - 1)},${toY(0)}`
        ].join(" ")}
        fill="url(#sparkGradFill)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none" stroke="#3b82f6" strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round"
      />

      {/* Dots */}
      {history.map((h, i) => (
        <circle
          key={i}
          cx={toX(i)} cy={toY(h.score)}
          r={i === history.length - 1 ? 3 : 2}
          fill={i === history.length - 1 ? "#3b82f6" : "white"}
          stroke="#3b82f6" strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

export default function ConfidenceEvolutionPanel({ history }: Props) {
  if (history.length === 0) return null;

  const latest = history[history.length - 1];
  const scorePercent = Math.round(latest.score * 100);
  const scoreColor = getScoreColor(latest.score);
  const scoreBg = getScoreBg(latest.score);
  const scoreBorder = getScoreBorder(latest.score);
  const coveredCount = CATEGORY_ORDER.filter(k => latest.categories[k]).length;

  const patientEntries = Object.entries(latest.patientInfo ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  );

  return (
    <div style={{
      width: 300,
      flexShrink: 0,
      background: "white",
      borderLeft: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      height: "100%",
    }}>
      {/* Panel header */}
      <div style={{
        padding: "12px 16px 10px",
        borderBottom: "1px solid #f3f4f6",
        background: "#f9fafb",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Razonamiento en tiempo real
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>
          Turno {latest.turn} · {coveredCount}/{CATEGORY_ORDER.length} categorías
        </p>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Confidence score */}
        <div style={{
          background: scoreBg,
          border: `1px solid ${scoreBorder}`,
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transition: "background 0.4s ease, border-color 0.4s ease"
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: scoreColor, fontWeight: 600 }}>
              Confianza diagnóstica
            </p>
            <div style={{ marginTop: 6, height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${scorePercent}%`,
                background: scoreColor,
                borderRadius: 3,
                transition: "width 0.5s ease",
              }} />
            </div>
            {latest.score >= 0.7 && (
              <p style={{ margin: "4px 0 0", fontSize: 10, color: scoreColor }}>
                Listo para diagnóstico
              </p>
            )}
          </div>
          <div style={{
            fontSize: 26,
            fontWeight: 800,
            color: scoreColor,
            lineHeight: 1,
            minWidth: 44,
            textAlign: "right",
            transition: "color 0.4s ease"
          }}>
            {scorePercent}%
          </div>
        </div>

        {/* Agent reasoning card — the most prominent section */}
        {latest.agentReasoning ? (
          <div style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 10,
            padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>🧠</span>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#0369a1", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Pensamiento clínico
              </p>
            </div>
            <p style={{
              margin: 0,
              fontSize: 12,
              color: "#0c4a6e",
              lineHeight: 1.55,
              fontStyle: "italic",
            }}>
              {latest.agentReasoning}
            </p>
          </div>
        ) : (
          <div style={{
            background: "#f9fafb",
            border: "1px dashed #d1d5db",
            borderRadius: 10,
            padding: "10px 12px",
            textAlign: "center",
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>
              El razonamiento aparecerá en el siguiente turno…
            </p>
          </div>
        )}

        {/* Patient demographics */}
        {patientEntries.length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Datos del paciente
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {patientEntries.map(([key, value]) => {
                const label = PATIENT_INFO_LABELS[key] ?? key;
                return (
                  <span key={key} style={{
                    padding: "3px 8px",
                    borderRadius: 10,
                    background: "#f3f4f6",
                    color: "#374151",
                    fontSize: 11,
                    fontWeight: 500,
                    border: "1px solid #e5e7eb"
                  }}>
                    <span style={{ color: "#9ca3af" }}>{label}: </span>
                    {formatPatientValue(key, value)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Category bars */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Categorías
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {CATEGORY_ORDER.map(key => {
              const covered = !!latest.categories[key];
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: covered ? "none" : "1.5px solid #d1d5db",
                    background: covered ? "#16a34a" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.3s ease, border 0.3s ease"
                  }}>
                    {covered && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: 3,
                      background: "#f3f4f6",
                      borderRadius: 2,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: covered ? "100%" : "0%",
                        background: "#16a34a",
                        borderRadius: 2,
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: covered ? "#111827" : "#9ca3af",
                    fontWeight: covered ? 500 : 400,
                    transition: "color 0.3s ease",
                    minWidth: 140,
                    textAlign: "left",
                  }}>
                    {CATEGORY_LABELS[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sparkline */}
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Evolución
          </p>
          <Sparkline history={history} />
        </div>

        {/* Symptom chips */}
        {latest.symptoms.length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Síntomas detectados
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {latest.symptoms.map((symptom, i) => (
                <span key={i} style={{
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: 11,
                  fontWeight: 500,
                  border: "1px solid #bfdbfe"
                }}>
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
