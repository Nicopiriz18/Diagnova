# Diagnova 🏥

Un asistente médico inteligente basado en agentes que utiliza IA para conducir entrevistas clínicas, analizar imágenes médicas y generar evaluaciones diagnósticas estructuradas.

## 🌟 Características Principales

### 🤖 Sistema de Agentes con LangGraph
- **Agente Entrevistador**: Conduce anamnesis adaptativa y estructurada
- **Agente de Análisis de Imágenes**: Analiza imágenes médicas con GPT-4o Vision
- **Agente de Diagnóstico**: Genera evaluaciones clínicas completas
- **Orquestador**: Gestiona el flujo conversacional inteligente

### 🖼️ Análisis de Imágenes Médicas
- Subida de imágenes en cualquier momento
- Análisis con GPT-4o Vision
- Extracción de hallazgos visuales estructurados
- Integración de hallazgos al contexto diagnóstico

### 💾 Gestión de Sesiones
- Conversaciones persistentes en PostgreSQL
- Historial completo de mensajes e imágenes
- Estado conversacional recuperable
- Resultados diagnósticos almacenados

### 🖥️ Interfaz de Chat Moderna
- Interfaz conversacional tipo ChatGPT
- Subida de imágenes con preview
- Indicadores de estado en tiempo real
- Panel de diagnóstico expandible
- Diseño responsive (móvil/desktop)
- **Ver:** [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)

## 🏗️ Arquitectura

```
Usuario → FastAPI → LangGraph Agents → GPT-4o → PostgreSQL
```

**Stack Tecnológico:**
- **Backend**: FastAPI (Python)
- **Agentes**: LangGraph + LangChain
- **LLM**: GPT-4 Turbo + GPT-4o Vision
- **Database**: PostgreSQL
- **Storage**: Local / S3
- **Frontend**: Next.js (React)

## 🚀 Quick Start

### Prerrequisitos
- Docker & Docker Compose
- Clave API de OpenAI

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Diagnova

# 2. Crear archivo .env (ver CONFIG.md para el template completo)
cat > .env << EOF
OPENAI_API_KEY=tu_clave_aqui
# ... otras configuraciones
EOF

# 3. Iniciar servicios
docker-compose up -d

# 4. El sistema se inicializa automáticamente:
#    - Base de datos (migraciones)
#    - API en http://localhost:8000
#    - Frontend en http://localhost:3000

# 5. Verificar
curl http://localhost:8000/health

# 6. Abrir frontend
# Ve a http://localhost:3000 en tu navegador
```

### Interfaces Disponibles

**1. Frontend Web (Recomendado)** 🎨
- URL: http://localhost:3000
- Interfaz de chat moderna
- Subida de imágenes
- Diagnóstico interactivo

**2. API Swagger** 📚
- URL: http://localhost:8000/docs
- Documentación interactiva
- Probar endpoints manualmente

**3. API Directa** 💻
- Ver ejemplos en [QUICKSTART.md](QUICKSTART.md)

## 📖 Documentación

- **[SETUP.md](SETUP.md)** - Guía completa de instalación y configuración
- **[CONFIG.md](CONFIG.md)** - Variables de entorno y configuración
- **API Docs** - http://localhost:8000/docs (Swagger UI)

## 🔄 Flujo de Uso

### 1. Crear Sesión
```bash
POST /v1/sessions
```

### 2. Conversación Iterativa
```bash
POST /v1/sessions/{id}/messages
{
  "content": "Tengo dolor de cabeza intenso desde ayer"
}
```

El agente entrevistador:
- Hace preguntas relevantes adaptadas al contexto
- Extrae síntomas y antecedentes
- Evalúa completitud de información

### 3. Subir Imágenes (Opcional)
```bash
POST /v1/sessions/{id}/images
[multipart/form-data con archivo]
```

El agente de imágenes:
- Analiza la imagen con GPT-4o Vision
- Extrae hallazgos visuales
- Integra al contexto clínico

### 4. Generar Diagnóstico
```bash
# Automático cuando hay suficiente información
# O forzado manualmente:
POST /v1/sessions/{id}/finalize
```

El agente diagnóstico:
- Genera evaluación estructurada:
  - Diagnósticos diferenciales
  - Red flags y urgencias
  - Plan de acción
  - Nota SOAP

## 📊 Output del Sistema

El sistema genera una evaluación clínica completa en formato JSON:

```json
{
  "differentials": [
    {
      "name": "Migraña",
      "likelihood": 75,
      "reasoning": "Cefalea unilateral, pulsátil...",
      "urgency": "urgent"
    }
  ],
  "red_flags": [
    {
      "severity": "warning",
      "message": "Cefalea de inicio reciente",
      "why_it_matters": "Requiere evaluación..."
    }
  ],
  "action_plan": [...],
  "soap": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "patient_summary": "...",
  "limitations": "..."
}
```

## 🧪 Testing

```bash
cd apps/api
pytest tests/ -v
```

## 📁 Estructura del Proyecto

```
Diagnova/
├── apps/
│   ├── api/                    # Backend FastAPI
│   │   ├── app/
│   │   │   ├── agents/        # Sistema de agentes LangGraph
│   │   │   │   ├── state.py
│   │   │   │   ├── interviewer.py
│   │   │   │   ├── image_analyzer.py
│   │   │   │   ├── diagnostic.py
│   │   │   │   ├── orchestrator.py
│   │   │   │   └── graph.py
│   │   │   ├── services/      # Servicios
│   │   │   │   ├── llm.py
│   │   │   │   ├── storage.py
│   │   │   │   └── session_service.py
│   │   │   ├── models/        # Modelos Pydantic
│   │   │   ├── db/            # SQLAlchemy models
│   │   │   └── main.py        # Endpoints FastAPI
│   │   ├── data/              # Conocimiento médico
│   │   │   ├── sample_cases.json
│   │   │   └── clinical_guidelines/
│   │   ├── alembic/           # Migraciones DB
│   │   ├── scripts/           # Scripts utilidad
│   │   └── tests/             # Tests
│   └── web/                    # Frontend Next.js
├── docker-compose.yml
├── .env                        # Configuración (crear)
├── CONFIG.md
├── SETUP.md
└── README.md
```

## ⚠️ Consideraciones Importantes

### Uso Médico
- **NO es un dispositivo médico certificado**
- Es una herramienta de **APOYO** para profesionales
- **NO reemplaza** el juicio clínico profesional
- Requiere validación por profesionales médicos

### Privacidad y Seguridad
- Implementar autenticación/autorización en producción
- Encriptar datos sensibles
- Considerar cumplimiento HIPAA si aplica
- No usar con datos reales de pacientes sin la infraestructura adecuada

### Costos
- OpenAI API: GPT-4 puede ser costoso
- Implementar rate limiting y monitoreo de costos

## 🛠️ Desarrollo

### Extender con Nuevos Agentes

1. Crear agente en `apps/api/app/agents/my_agent.py`
2. Actualizar `graph.py` para incluir el nodo
3. Actualizar lógica de routing en `orchestrator.py`

## 🤝 Contribución

Este es un proyecto de demostración. Para uso en producción:
1. Realizar auditoría de seguridad
2. Validación médica profesional
3. Cumplimiento regulatorio
4. Testing exhaustivo

## 📝 Licencia

Ver archivo LICENSE.

## 🙏 Agradecimientos

Construido con:
- LangChain / LangGraph
- OpenAI GPT-4
- FastAPI
- PostgreSQL

---

**⚕️ DISCLAIMER**: Este sistema es para fines educativos y de investigación. No debe usarse para diagnósticos médicos reales sin supervisión profesional adecuada y validación clínica.
