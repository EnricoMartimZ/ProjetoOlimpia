import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertCircle, ClipboardList } from "lucide-react";
import { SurveyFieldInput } from "../../components/SurveyFieldInput";
import { useAuth } from "../../context/AuthContext";
import {
  getEdicoesCampo,
  getEdicaoCampoForm,
  submitRespostaCampo,
  type EdicaoAPI,
  type PublicEdicaoAPI,
  type CampoAPI,
} from "../../../services/api";
import type { Field } from "../../../types";

// Converte o campo vindo da API para o formato esperado por SurveyFieldInput.
function toField(c: CampoAPI): Field {
  return {
    id: c.id,
    tipo: c.tipo,
    label: c.texto_pergunta,
    required: c.obrigatorio,
    opcoes: c.opcoes.length > 0 ? c.opcoes : undefined,
  };
}

export function ResponderPage() {
  const { user } = useAuth();

  // Edições de campo disponíveis para coleta
  const [edicoes, setEdicoes] = useState<EdicaoAPI[]>([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(true);
  const [edicoesError, setEdicoesError] = useState<string | null>(null);

  // Edição selecionada + formulário
  const [selectedEdicaoId, setSelectedEdicaoId] = useState<number | null>(null);
  const [form, setForm] = useState<PublicEdicaoAPI | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Preenchimento
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // -------------------------------------------------------------------------
  // Carrega edições de campo abertas
  // -------------------------------------------------------------------------
  useEffect(() => {
    let ativo = true;
    setLoadingEdicoes(true);
    setEdicoesError(null);
    getEdicoesCampo()
      .then((data) => {
        if (!ativo) return;
        setEdicoes(data);
        // Auto-seleciona se houver exatamente uma edição
        if (data.length === 1) setSelectedEdicaoId(data[0].id);
      })
      .catch((e) => {
        if (ativo) setEdicoesError(e instanceof Error ? e.message : "Erro ao carregar pesquisas de campo.");
      })
      .finally(() => {
        if (ativo) setLoadingEdicoes(false);
      });
    return () => { ativo = false; };
  }, []);

  // -------------------------------------------------------------------------
  // Carrega o formulário da edição selecionada
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (selectedEdicaoId == null) {
      setForm(null);
      return;
    }
    let ativo = true;
    setLoadingForm(true);
    setFormError(null);
    setForm(null);
    setStep(0);
    setAnswers({});
    getEdicaoCampoForm(selectedEdicaoId)
      .then((data) => { if (ativo) setForm(data); })
      .catch((e) => { if (ativo) setFormError(e instanceof Error ? e.message : "Erro ao carregar o formulário."); })
      .finally(() => { if (ativo) setLoadingForm(false); });
    return () => { ativo = false; };
  }, [selectedEdicaoId]);

  const campos = useMemo(() => (form ? form.campos.map(toField) : []), [form]);
  const totalSteps = campos.length;
  const currentField = campos[step];
  const progress = totalSteps ? ((step + 1) / totalSteps) * 100 : 0;

  const setAnswer = (fieldId: number, value: string | number) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  const canNext = () => {
    if (!currentField) return false;
    if (!currentField.required) return true;
    return answers[currentField.id] !== undefined && answers[currentField.id] !== "";
  };

  const handleSubmit = async () => {
    if (!form) return;
    const respostas = form.campos
      .filter((c) => answers[c.id] !== undefined && answers[c.id] !== "")
      .map((c) => ({ campo_id: c.id, atributo_texto: String(answers[c.id]) }));

    if (respostas.length === 0) {
      setSubmitError("Preencha ao menos um campo antes de enviar.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitRespostaCampo(form.edicao_id, respostas);
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Erro ao registrar a resposta.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setStep(0);
    setAnswers({});
    setSubmitError(null);
  };

  const selectedEdicao = edicoes.find((e) => e.id === selectedEdicaoId) ?? null;

  // -------------------------------------------------------------------------
  // Tela de sucesso
  // -------------------------------------------------------------------------
  if (submitted && form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96 gap-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="p-5 rounded-full" style={{ backgroundColor: "#E8F5E9" }}>
          <CheckCircle size={48} color="#2E7D32" />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40", textAlign: "center" }}>
          Coleta registrada!
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", maxWidth: 380 }}>
          A resposta foi salva e vinculada a você ({user?.nome}) na{" "}
          {form.numero_edicao}ª edição de “{form.pesquisa_nome}”.
        </p>
        <div className="rounded-xl p-4 w-full max-w-sm" style={{ backgroundColor: "#F9F9F9", border: "1px solid #F0EDE8" }}>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>Resumo da coleta</p>
          {form.campos.map((c) => (
            <div key={c.id} className="flex justify-between py-1.5 gap-3" style={{ borderBottom: "1px solid #F0EDE8" }}>
              <span style={{ fontSize: 12, color: "#6B7280" }}>{c.texto_pergunta}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1B1D40", textAlign: "right" }}>
                {answers[c.id] ?? "—"}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={reset}
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
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1B1D40" }}>Responder Pesquisa de Campo</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          {user?.nome ? `${user.nome} — ` : ""}registre as respostas coletadas presencialmente com o turista
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de seleção */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1B1D40", marginBottom: 12 }}>
              Pesquisa de campo
            </h3>

            {loadingEdicoes && (
              <div className="flex items-center gap-2 py-2" style={{ color: "#9CA3AF" }}>
                <Loader2 size={15} className="animate-spin" />
                <span style={{ fontSize: 13 }}>Carregando...</span>
              </div>
            )}

            {edicoesError && (
              <div className="flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                <AlertCircle size={14} color="#C62828" className="shrink-0 mt-0.5" />
                <p style={{ fontSize: 12, color: "#C62828" }}>{edicoesError}</p>
              </div>
            )}

            {!loadingEdicoes && !edicoesError && edicoes.length === 0 && (
              <div className="text-center py-6" style={{ color: "#9CA3AF" }}>
                <ClipboardList size={28} className="mx-auto mb-2" />
                <p style={{ fontSize: 13 }}>Nenhuma pesquisa de campo aberta no momento.</p>
              </div>
            )}

            <div className="space-y-2">
              {edicoes.map((e) => {
                const active = e.id === selectedEdicaoId;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEdicaoId(e.id)}
                    className="w-full text-left rounded-lg p-3 transition-all"
                    style={{
                      border: `2px solid ${active ? "#F5C100" : "#E5E7EB"}`,
                      backgroundColor: active ? "#FFFBEB" : "#F9F9F9",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1B1D40" }}>{e.pesquisa_nome}</p>
                    <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                      {e.numero_edicao}ª edição · {e.total_respostas} resposta{e.total_respostas !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progresso */}
          {form && campos.length > 0 && (
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <h3 style={{ fontWeight: 700, fontSize: 13, color: "#1B1D40", marginBottom: 10 }}>Progresso</h3>
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
                        backgroundColor: answers[f.id] !== undefined ? "#2E7D32" : step === i ? "#F5C100" : "#E5E7EB",
                        color: answers[f.id] !== undefined || step === i ? "white" : "#9CA3AF",
                      }}
                    >
                      {answers[f.id] !== undefined ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 11, color: step === i ? "#1B1D40" : "#6B7280", fontWeight: step === i ? 600 : 400 }}>
                      {f.label.length > 28 ? f.label.slice(0, 28) + "…" : f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Painel do formulário */}
        <div className="lg:col-span-2">
          {!selectedEdicao ? (
            <div className="rounded-xl shadow-sm p-10 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div className="p-4 rounded-full" style={{ backgroundColor: "#FFF3CD" }}>
                <ClipboardList size={28} color="#F5C100" />
              </div>
              <p style={{ fontWeight: 600, fontSize: 15, color: "#1B1D40" }}>Selecione uma pesquisa de campo</p>
              <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>
                Escolha ao lado a pesquisa que você irá coletar para começar.
              </p>
            </div>
          ) : (
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}>
              <div style={{ height: 4, backgroundColor: "#F0EDE8" }}>
                <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "#F5C100", transition: "width 0.3s ease" }} />
              </div>

              <div className="p-6">
                {loadingForm && (
                  <div className="flex items-center gap-2 justify-center py-10" style={{ color: "#9CA3AF" }}>
                    <Loader2 size={18} className="animate-spin" />
                    <span style={{ fontSize: 14 }}>Carregando formulário...</span>
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-2 rounded-lg px-4 py-3" style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                    <AlertCircle size={14} color="#C62828" />
                    <p style={{ fontSize: 13, color: "#C62828" }}>{formError}</p>
                  </div>
                )}

                {form && currentField && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#1B1D40", color: "white" }}>
                        {step + 1}
                      </span>
                      <div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                          Pergunta {step + 1} de {totalSteps}
                          {currentField.required && <span style={{ color: "#C8102E" }}> *</span>}
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#1B1D40" }}>{currentField.label}</p>
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

                    {submitError && (
                      <div className="flex items-center gap-2 rounded-lg px-4 py-3 mt-4" style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
                        <AlertCircle size={14} color="#C62828" />
                        <p style={{ fontSize: 13, color: "#C62828" }}>{submitError}</p>
                      </div>
                    )}

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
                          disabled={!canNext() || submitting}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
                          style={{ backgroundColor: "#1B1D40", color: "white" }}
                        >
                          {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                          {submitting ? "Salvando..." : "Salvar resposta"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
