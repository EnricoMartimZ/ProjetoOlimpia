import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, MapPin } from "lucide-react";
import { researches } from "../../data/mockData";
import { SurveyFieldInput } from "../../components/SurveyFieldInput";
import { useAppStore } from "../../context/AppStore";
import type { ResponseRow } from "../../../types";

const demandaTuristica = researches.find((r) => r.id === 1)!;

const LOCAIS = [
  "Thermas dos Laranjais",
  "Rodoviária Municipal",
  "Centro Histórico",
  "Av. Carlos Pereira Bacci",
];

function formatDateBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ResponderPage() {
  const { addResponseRow, editions } = useAppStore();

  const [step, setStep] = useState(0);
  const [selectedResearch] = useState(demandaTuristica);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [touristName, setTouristName] = useState("");
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [collectionLocation, setCollectionLocation] = useState(LOCAIS[0]);

  const campos = selectedResearch.campos;
  const totalSteps = campos.length;
  const currentField = campos[step];
  const progress = ((step + 1) / totalSteps) * 100;

  const setAnswer = (fieldId: number, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const canNext = () => {
    if (!currentField) return false;
    if (!currentField.required) return true;
    return answers[currentField.id] !== undefined && answers[currentField.id] !== "";
  };

  const handleSubmit = () => {
    const activeEdition = editions.find(
      (e) => e.pesquisaId === selectedResearch.id && e.status === "ativa"
    );

    const row: ResponseRow = {
      id: Date.now(),
      pesquisaId: selectedResearch.id,
      edicaoId: activeEdition?.id,
      data: formatDateBR(collectionDate),
      pesquisador: "Ana Paula Silva",
      cidade: String(answers[1] ?? "—"),
      motivo: String(answers[2] ?? "—"),
      visitas: Number(answers[3] ?? 0),
      dias: Number(answers[4] ?? 0),
      hospedagem: String(answers[5] ?? "—"),
      faixa: String(answers[6] ?? "—"),
      nota: Number(answers[7] ?? 0),
    };

    addResponseRow(row);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="p-6 flex flex-col items-center justify-center min-h-96 gap-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="p-5 rounded-full" style={{ backgroundColor: "#E8F5E9" }}>
          <CheckCircle size={48} color="#2E7D32" />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40", textAlign: "center" }}>
          Resposta registrada!
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", maxWidth: 360 }}>
          Os dados do turista foram salvos com sucesso na edição ativa da pesquisa de Demanda Turística.
        </p>
        <div
          className="rounded-xl p-4 w-full max-w-sm"
          style={{ backgroundColor: "#F9F9F9", border: "1px solid #F0EDE8" }}
        >
          <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>Resumo da coleta</p>
          {touristName && (
            <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid #F0EDE8" }}>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Turista</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1B1D40" }}>{touristName}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid #F0EDE8" }}>
            <span style={{ fontSize: 12, color: "#6B7280" }}>Data</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1B1D40" }}>{formatDateBR(collectionDate)}</span>
          </div>
          <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid #F0EDE8" }}>
            <span style={{ fontSize: 12, color: "#6B7280" }}>Local</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1B1D40" }}>{collectionLocation}</span>
          </div>
          {campos.map((f) => (
            <div
              key={f.id}
              className="flex justify-between py-1.5"
              style={{ borderBottom: "1px solid #F0EDE8" }}
            >
              <span style={{ fontSize: 12, color: "#6B7280" }}>{f.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1B1D40" }}>
                {answers[f.id] ?? "—"}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setSubmitted(false); setStep(0); setAnswers({}); setTouristName(""); }}
          className="px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
        >
          Registrar nova resposta
        </button>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6">
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>Responder Pesquisa</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          Registre as respostas coletadas presencialmente com o turista
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tourist info panel */}
        <div className="lg:col-span-1 space-y-4">
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 12 }}>
              Dados do Turista
            </h3>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Nome do turista</label>
                <input
                  type="text"
                  value={touristName}
                  onChange={(e) => setTouristName(e.target.value)}
                  placeholder="Nome (opcional)"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Data da coleta</label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Local de coleta</label>
                <div className="relative mt-1">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={collectionLocation}
                    onChange={(e) => setCollectionLocation(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none appearance-none"
                    style={{ border: "1px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                  >
                    {LOCAIS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Progress overview */}
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <h3 style={{ fontWeight: 700, fontSize: 13, color: "#1B1D40", marginBottom: 10 }}>
              Progresso
            </h3>
            <div className="space-y-1.5">
              {campos.map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5"
                  onClick={() => setStep(i)}
                  style={{ backgroundColor: step === i ? "#FFF3CD" : "transparent" }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor:
                        answers[f.id] !== undefined
                          ? "#2E7D32"
                          : step === i
                          ? "#F5C100"
                          : "#E5E7EB",
                      color: answers[f.id] !== undefined || step === i ? "white" : "#9CA3AF",
                    }}
                  >
                    {answers[f.id] !== undefined ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: step === i ? "#1B1D40" : "#6B7280",
                      fontWeight: step === i ? 600 : 400,
                    }}
                  >
                    {f.label.length > 28 ? f.label.slice(0, 28) + "…" : f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl shadow-sm overflow-hidden"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <div style={{ height: 4, backgroundColor: "#F0EDE8" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor: "#F5C100",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: "#1B1D40", color: "white" }}
                >
                  {step + 1}
                </span>
                <div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Pergunta {step + 1} de {totalSteps}
                    {currentField.required && <span style={{ color: "#C8102E" }}> *</span>}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#1B1D40" }}>
                    {currentField.label}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <SurveyFieldInput
                  field={currentField}
                  value={answers[currentField.id]}
                  onChange={(v) => setAnswer(currentField.id, v)}
                  variant="researcher"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{ border: "1px solid #E5E7EB", color: "#374151" }}
                >
                  <ChevronLeft size={15} />
                  Anterior
                </button>

                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {Object.keys(answers).length}/{totalSteps} respondidas
                </span>

                {step < totalSteps - 1 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                    style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
                  >
                    Próxima
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canNext()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                    style={{ backgroundColor: "#1B1D40", color: "white" }}
                  >
                    <CheckCircle size={15} />
                    Salvar resposta
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
