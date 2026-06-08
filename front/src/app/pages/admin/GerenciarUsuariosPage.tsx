import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, Loader2, User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  getUsuarios,
  cadastrar,
  deleteUsuario,
  updateUsuarioRoles,
  type UsuarioListItem,
  type RoleType,
} from "../../../services/api";
import { useAuth } from "../../context/AuthContext";

// ---------------------------------------------------------------------------
// Cores e labels dos perfis
// ---------------------------------------------------------------------------

const ROLE_META: Record<RoleType, { label: string; bg: string; text: string; checkBg: string }> = {
  servidor: {
    label: "ADM",
    bg: "#F5C944",
    text: "#1D2E36",
    checkBg: "#F5C944",
  },
  pesquisador_campo: {
    label: "Pesquisador",
    bg: "#1D2E36",
    text: "white",
    checkBg: "#1D2E36",
  },
};

const ALL_ROLES: RoleType[] = ["servidor", "pesquisador_campo"];

function RoleBadge({ role }: { role: RoleType }) {
  const m = ROLE_META[role];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-1"
      style={{ backgroundColor: m.bg, color: m.text }}
    >
      {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Checkbox de perfil reutilizável
// ---------------------------------------------------------------------------

interface RoleCheckboxProps {
  role: RoleType;
  checked: boolean;
  onChange: (r: RoleType) => void;
}

function RoleCheckbox({ role, checked, onChange }: RoleCheckboxProps) {
  const m = ROLE_META[role];
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(role)}
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
        style={{
          backgroundColor: checked ? m.checkBg : "white",
          border: `2px solid ${checked ? m.checkBg : "#D1D5DB"}`,
        }}
      >
        {checked && <Check size={11} color={m.text} strokeWidth={3} />}
      </button>
      <span
        className="text-sm font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: m.bg, color: m.text }}
      >
        {m.label}
      </span>
    </label>
  );
}

function useRoleSet(initial: RoleType[]) {
  const [roles, setRoles] = useState<Set<RoleType>>(new Set(initial));

  const toggle = (r: RoleType) => {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(r)) {
        if (next.size === 1) return prev; // pelo menos um obrigatório
        next.delete(r);
      } else {
        next.add(r);
      }
      return next;
    });
  };

  return { roles, toggle };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ---------------------------------------------------------------------------
// Modal de criação de novo usuário
// ---------------------------------------------------------------------------

interface NovoUsuarioModalProps {
  onClose: () => void;
  onCreated: (u: UsuarioListItem) => void;
}

function NovoUsuarioModal({ onClose, onCreated }: NovoUsuarioModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { roles, toggle } = useRoleSet(["pesquisador_campo"]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const criado = await cadastrar({ nome, email, senha, roles: Array.from(roles) });
      onCreated(criado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "1px solid #E5E7EB",
    backgroundColor: "#F9F9F9",
    color: "#1D2E36",
    fontFamily: "Inter, sans-serif",
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "white" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: "#F5C944" }}
        >
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36" }}>Novo usuário</h2>
            <p style={{ fontSize: 12, color: "#5A5A2A" }}>Preencha os dados de acesso</p>
          </div>
          <button onClick={onClose}>
            <X size={20} color="#1D2E36" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              Nome completo
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              E-mail
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              Senha inicial
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha de acesso"
                required
                className="w-full pl-9 pr-10 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Perfis */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Perfil(is) de acesso
            </label>
            <div
              className="flex flex-col gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB" }}
            >
              {ALL_ROLES.map((r) => (
                <RoleCheckbox
                  key={r}
                  role={r}
                  checked={roles.has(r)}
                  onChange={toggle}
                />
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
              Selecione um ou ambos os perfis.
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
            >
              <AlertCircle size={13} color="#C62828" />
              <p style={{ fontSize: 12, color: "#C62828" }}>{erro}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid #E5E7EB", color: "#374151" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: "#1D2E36", color: "white" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal de confirmação de remoção
// ---------------------------------------------------------------------------

interface ConfirmDeleteProps {
  nome: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ nome, onConfirm, onCancel, loading }: ConfirmDeleteProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6"
        style={{ backgroundColor: "white" }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1D2E36", marginBottom: 8 }}>
          Remover usuário
        </h3>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
          Deseja remover <strong style={{ color: "#1D2E36" }}>{nome}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid #E5E7EB", color: "#374151" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "#C8102E", color: "white" }}
          >
            {loading ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor inline de perfis (na tabela)
// ---------------------------------------------------------------------------

interface RoleEditorProps {
  usuario: UsuarioListItem;
  onSaved: (updated: UsuarioListItem) => void;
  onCancel: () => void;
}

function RoleEditor({ usuario, onSaved, onCancel }: RoleEditorProps) {
  const { roles, toggle } = useRoleSet(usuario.roles as RoleType[]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setErro(null);
    try {
      const updated = await updateUsuarioRoles(usuario.id, Array.from(roles));
      onSaved(updated);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-col gap-2 p-2 rounded-lg"
        style={{ backgroundColor: "#F9F9F9", border: "1px solid #E5E7EB" }}
      >
        {ALL_ROLES.map((r) => (
          <RoleCheckbox
            key={r}
            role={r}
            checked={roles.has(r)}
            onChange={toggle}
            disabled={roles.has(r) && roles.size === 1}
          />
        ))}
      </div>

      {erro && (
        <p style={{ fontSize: 11, color: "#C62828" }}>{erro}</p>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ backgroundColor: "#1D2E36", color: "white" }}
        >
          {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ border: "1px solid #E5E7EB", color: "#374151" }}
        >
          <X size={10} />
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export function GerenciarUsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [showNovo, setShowNovo] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getUsuarios()
      .then(setUsuarios)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (novo: UsuarioListItem) => {
    setUsuarios((prev) => [...prev, novo]);
    setShowNovo(false);
  };

  const handleRoleSaved = (updated: UsuarioListItem) => {
    setUsuarios((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteUsuario(deletingId);
      setUsuarios((prev) => prev.filter((u) => u.id !== deletingId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover usuário.");
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const usuarioParaDelete = usuarios.find((u) => u.id === deletingId);

  return (
    <div className="p-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "#1D2E36" }}>Usuários</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            Gerencie os acessos ao sistema
          </p>
        </div>
        <button
          onClick={() => setShowNovo(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#F5C944", color: "#1D2E36" }}
        >
          <Plus size={13} />
          Novo usuário
        </button>
      </div>

      {/* Erro global */}
      {erro && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4"
          style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}
        >
          <AlertCircle size={14} color="#C62828" />
          <p style={{ fontSize: 13, color: "#C62828" }}>{erro}</p>
        </div>
      )}

      {/* Tabela */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid #F0EDE8" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#1D2E36" }}>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Nome</th>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>E-mail</th>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Perfil(is)</th>
                <th className="px-4 py-3 text-left whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Cadastrado em</th>
                <th className="px-4 py-3 whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center" style={{ color: "#9CA3AF", fontSize: 13 }}>
                    <Loader2 size={18} className="animate-spin inline mr-2" />
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center" style={{ color: "#9CA3AF", fontSize: 13 }}>
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
              {!loading &&
                usuarios.map((u, i) => {
                  const isSelf = user?.id === String(u.id);
                  const isEditing = editingId === u.id;
                  return (
                    <tr
                      key={u.id}
                      style={{ backgroundColor: i % 2 === 0 ? "white" : "#FAFAFA" }}
                    >
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#1D2E36" }}>
                        {u.nome}
                        {isSelf && (
                          <span
                            className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#F5C94433", color: "#B8860B" }}
                          >
                            você
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{u.email}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <RoleEditor
                            usuario={u}
                            onSaved={handleRoleSaved}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.roles as RoleType[]).map((r) => (
                              <RoleBadge key={r} role={r} />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>
                        {formatDate(u.criado_em)}
                      </td>
                      <td className="px-4 py-3">
                        {!isEditing && (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setEditingId(u.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Editar perfil"
                            >
                              <Pencil size={13} style={{ color: "#6B7280" }} />
                            </button>
                            <button
                              onClick={() => !isSelf && setDeletingId(u.id)}
                              disabled={isSelf}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                              title={isSelf ? "Você não pode remover sua própria conta" : "Remover usuário"}
                            >
                              <Trash2 size={13} className="text-red-400 hover:text-red-600" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        {!loading && (
          <div className="px-4 py-3" style={{ borderTop: "1px solid #F0EDE8" }}>
            <p style={{ fontSize: 12, color: "#6B7280" }}>
              {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""} cadastrado{usuarios.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      {showNovo && <NovoUsuarioModal onClose={() => setShowNovo(false)} onCreated={handleCreated} />}
      {deletingId && usuarioParaDelete && (
        <ConfirmDeleteModal
          nome={usuarioParaDelete.nome}
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
