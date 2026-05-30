import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { ColorStripe } from "../components/ColorStripe";
import { OlimpiaLogo } from "../components/OlimpiaLogo";
import { useAppStore } from "../context/AppStore";
import { toSlug } from "../../lib/constants";

export function PublicSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { researches } = useAppStore();

  const research =
    researches.find((r) => toSlug(r.nome) === id) ??
    researches.find((r) => r.publicLink === `/pesquisa/${id}`) ??
    researches[0];

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitted, setSubmitted] = useState(false);

  const campos = research.campos;
  const currentField = campos[step];
  const progress = ((step + 1) / campos.length) * 100;

  const setAnswer = (fieldId: number, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const canNext = () => {
    if (!currentField) return false;
    if (!currentField.required) return true;
    return answers[currentField.id] !== undefined && answers[currentField.id] !== "";
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 p-6"
        style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
      >
        <OlimpiaLogo size="md" variant="full" />
        <div
          className="rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
          style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
        >
          <div className="p-4 rounded-full inline-block mb-4" style={{ backgroundColor: "#E8F5E9" }}>
            <CheckCircle size={40} color="#2E7D32" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>
            Obrigado pela sua participação!
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 8, marginBottom: 20 }}>
            Suas respostas foram registradas com sucesso e contribuirão para o desenvolvimento do turismo em Olímpia.
          </p>
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #F0EDE8" }}
          >
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>Pesquisa respondida</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1B1D40" }}>{research.nome}</p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{campos.length} perguntas · {Object.keys(answers).length} respostas</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#1B1D40", color: "white" }}
          >
            Voltar ao início
          </button>
        </div>
        <ColorStripe orientation="horizontal" className="fixed bottom-0 left-0 right-0" />
      </div>
    );
  }

  if (!started) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <OlimpiaLogo size="md" variant="full" />
          <div
            className="rounded-2xl shadow-xl overflow-hidden w-full max-w-lg"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            {/* Card header */}
            <div className="p-6" style={{ backgroundColor: "#F5C100" }}>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ backgroundColor: "#1B1D40", color: "white" }}
              >
                Pesquisa Pública
              </span>
              <h1 style={{ fontWeight: 800, fontSize: 22, color: "#1B1D40" }}>
                {research.nome}
              </h1>
              <p style={{ fontSize: 13, color: "#5A5A2A", marginTop: 4 }}>
                {research.descricao}
              </p>
            </div>

            {/* Card body */}
            <div className="p-6">
              <div className="flex gap-6 mb-6">
                <div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#F5C100" }}>{campos.length}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>Perguntas</p>
                </div>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#00538C" }}>~3 min</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>Estimativa</p>
                </div>
              </div>

              <div
                className="rounded-xl p-4 mb-6"
                style={{ backgroundColor: "#F0F7FF", border: "1px solid #BFDBFE" }}
              >
                <p style={{ fontSize: 12, color: "#1D4ED8" }}>
                  Suas respostas são anônimas e serão utilizadas exclusivamente para fins estatísticos pela Secretaria de Turismo de Olímpia.
                </p>
              </div>

              <button
                onClick={() => setStarted(true)}
                className="w-full py-3.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: "#1B1D40", color: "white" }}
              >
                Começar pesquisa →
              </button>
            </div>
          </div>
        </div>
        <ColorStripe orientation="horizontal" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      {/* Mini header */}
      <header
        className="flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ backgroundColor: "#F5C100" }}
      >
        <OlimpiaLogo size="sm" variant="icon" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1D40" }}>{research.nome}</span>
        <span style={{ fontSize: 12, color: "#5A5A2A" }}>
          {step + 1} / {campos.length}
        </span>
      </header>

      {/* Progress bar */}
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

      {/* Question */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-xl">
          <div
            className="rounded-2xl shadow-sm p-8"
            style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
          >
            <div className="mb-6">
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-3"
                style={{ backgroundColor: "#FFF3CD", color: "#B8860B" }}
              >
                Pergunta {step + 1} de {campos.length}
                {currentField.required && <span style={{ color: "#C8102E" }}> *</span>}
              </span>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1B1D40", lineHeight: 1.4 }}>
                {currentField.label}
              </h2>
            </div>

            {/* Input */}
            <div className="space-y-3 mb-8">
              {currentField.tipo === "texto" && (
                <input
                  type="text"
                  value={(answers[currentField.id] as string) || ""}
                  onChange={(e) => setAnswer(currentField.id, e.target.value)}
                  placeholder="Sua resposta..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: "2px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                  autoFocus
                />
              )}

              {currentField.tipo === "texto_longo" && (
                <textarea
                  rows={4}
                  value={(answers[currentField.id] as string) || ""}
                  onChange={(e) => setAnswer(currentField.id, e.target.value)}
                  placeholder="Sua resposta..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ border: "2px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                  autoFocus
                />
              )}

              {currentField.tipo === "multipla_escolha" && (
                <div className="space-y-2">
                  {(currentField.opcoes || []).map((op, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(currentField.id, op)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all flex items-center gap-3"
                      style={{
                        backgroundColor: answers[currentField.id] === op ? "#F5C100" : "#F9F9F9",
                        color: answers[currentField.id] === op ? "#1B1D40" : "#374151",
                        border: `2px solid ${answers[currentField.id] === op ? "#F5C100" : "#E5E7EB"}`,
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: answers[currentField.id] === op ? "#1B1D40" : "#D1D5DB",
                          backgroundColor: answers[currentField.id] === op ? "#1B1D40" : "transparent",
                        }}
                      >
                        {answers[currentField.id] === op && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      {op}
                    </button>
                  ))}
                </div>
              )}

              {currentField.tipo === "escala" && (
                <div>
                  <div className="flex justify-between text-xs mb-2" style={{ color: "#9CA3AF" }}>
                    <span>Muito ruim</span>
                    <span>Excelente</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAnswer(currentField.id, v)}
                        className="flex-1 py-4 rounded-xl font-bold text-lg transition-all"
                        style={{
                          backgroundColor: answers[currentField.id] === v ? "#F5C100" : "#F9F9F9",
                          color: answers[currentField.id] === v ? "#1B1D40" : "#374151",
                          border: `2px solid ${answers[currentField.id] === v ? "#F5C100" : "#E5E7EB"}`,
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentField.tipo === "sim_nao" && (
                <div className="flex gap-3">
                  {["Sim", "Não"].map((op) => (
                    <button
                      key={op}
                      onClick={() => setAnswer(currentField.id, op)}
                      className="flex-1 py-4 rounded-xl font-bold text-base transition-all"
                      style={{
                        backgroundColor: answers[currentField.id] === op
                          ? op === "Sim" ? "#2E7D32" : "#C8102E"
                          : "#F9F9F9",
                        color: answers[currentField.id] === op ? "white" : "#374151",
                        border: `2px solid ${answers[currentField.id] === op
                          ? op === "Sim" ? "#2E7D32" : "#C8102E"
                          : "#E5E7EB"}`,
                      }}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              )}

              {currentField.tipo === "data" && (
                <input
                  type="date"
                  value={(answers[currentField.id] as string) || ""}
                  onChange={(e) => setAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: "2px solid #E5E7EB", backgroundColor: "#F9F9F9", color: "#1B1D40" }}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                style={{ border: "1px solid #E5E7EB", color: "#374151" }}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              {step < campos.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{ backgroundColor: "#F5C100", color: "#1B1D40" }}
                >
                  Próxima
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={!canNext()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                  style={{ backgroundColor: "#1B1D40", color: "white" }}
                >
                  <CheckCircle size={16} />
                  Enviar respostas
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ColorStripe orientation="horizontal" />
    </div>
  );
}
