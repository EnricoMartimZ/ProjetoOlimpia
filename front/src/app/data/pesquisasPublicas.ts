import type { CampoHeader, RespostaLinha } from "../../services/api";

const KEY = "olimpia_pesquisas_publicas";

export interface PesquisaPublicaSnapshot {
  pesquisaId: number;
  edicaoId: number;
  nome: string;
  campos: CampoHeader[];
  dados: RespostaLinha[];
  publicadoEm: string;
}

export function getSnapshotsPublicos(): PesquisaPublicaSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isPublico(pesquisaId: number): boolean {
  return getSnapshotsPublicos().some((s) => s.pesquisaId === pesquisaId);
}

export function publishSnapshot(snap: PesquisaPublicaSnapshot): void {
  const rest = getSnapshotsPublicos().filter((s) => s.pesquisaId !== snap.pesquisaId);
  localStorage.setItem(KEY, JSON.stringify([...rest, snap]));
}

export function unpublishSnapshot(pesquisaId: number): void {
  const rest = getSnapshotsPublicos().filter((s) => s.pesquisaId !== pesquisaId);
  localStorage.setItem(KEY, JSON.stringify(rest));
}
