import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Research, Edition, ResponseRow } from "../../types";
import { toSlug } from "../../lib/constants";
import {
  researches as initialResearches,
  editions as initialEditions,
  responseTableData as initialResponseRows,
} from "../data/mockData";

interface AppStore {
  researches: Research[];
  editions: Edition[];
  responseRows: ResponseRow[];
  addResearch: (r: Research) => void;
  updateResearch: (r: Research) => void;
  deleteResearch: (id: number) => void;
  addEdition: (e: Edition) => void;
  addResponseRow: (row: ResponseRow) => void;
  deleteResponseRow: (id: number) => void;
}

const Ctx = createContext<AppStore | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [researches, setResearches] = useState<Research[]>(() =>
    load("store_researches", initialResearches)
  );
  const [editions, setEditions] = useState<Edition[]>(() =>
    load("store_editions", initialEditions)
  );
  const [responseRows, setResponseRows] = useState<ResponseRow[]>(() =>
    load("store_responseRows", initialResponseRows)
  );

  useEffect(() => {
    localStorage.setItem("store_researches", JSON.stringify(researches));
  }, [researches]);
  useEffect(() => {
    localStorage.setItem("store_editions", JSON.stringify(editions));
  }, [editions]);
  useEffect(() => {
    localStorage.setItem("store_responseRows", JSON.stringify(responseRows));
  }, [responseRows]);

  const addResearch = (r: Research) => setResearches((p) => [...p, r]);

  const updateResearch = (r: Research) =>
    setResearches((p) => p.map((x) => (x.id === r.id ? r : x)));

  const deleteResearch = (id: number) =>
    setResearches((p) => p.filter((x) => x.id !== id));

  const addEdition = (e: Edition) => {
    setEditions((p) => [...p, e]);
    setResearches((p) =>
      p.map((r) => {
        if (r.id !== e.pesquisaId) return r;
        return { ...r, edicoes: r.edicoes + 1, status: "ativa", publicLink: `/pesquisa/${toSlug(r.nome)}` };
      })
    );
  };

  const addResponseRow = (row: ResponseRow) =>
    setResponseRows((p) => [...p, row]);

  const deleteResponseRow = (id: number) =>
    setResponseRows((p) => p.filter((x) => x.id !== id));

  return (
    <Ctx.Provider
      value={{
        researches,
        editions,
        responseRows,
        addResearch,
        updateResearch,
        deleteResearch,
        addEdition,
        addResponseRow,
        deleteResponseRow,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore used outside AppStoreProvider");
  return ctx;
}
