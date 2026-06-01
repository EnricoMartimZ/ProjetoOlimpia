import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { DiariaMediaPage } from "./pages/admin/DiariaMediaPage";
import { ConsultarPage } from "./pages/admin/ConsultarPage";
import { AdicionarPesquisaPage } from "./pages/admin/AdicionarPesquisaPage";
import { ResearcherLayout } from "./pages/researcher/ResearcherLayout";
import { ResearcherDashboard } from "./pages/researcher/ResearcherDashboard";
import { ResponderPage } from "./pages/researcher/ResponderPage";
import { PublicSurveyPage } from "./pages/PublicSurveyPage";
import { PublicStatsPage } from "./pages/PublicStatsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useAuth } from "./context/AuthContext";

function RequireRole({ role }: { role: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/cadastro",
    Component: CadastroPage,
  },
  {
    path: "/admin",
    element: <RequireRole role="servidor" />,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: "diaria-media", Component: DiariaMediaPage },
          { path: "consultar", Component: ConsultarPage },
          { path: "adicionar-pesquisa", Component: AdicionarPesquisaPage },
        ],
      },
    ],
  },
  {
    path: "/pesquisador",
    element: <RequireRole role="pesquisador_campo" />,
    children: [
      {
        Component: ResearcherLayout,
        children: [
          { index: true, Component: ResearcherDashboard },
          { path: "responder", Component: ResponderPage },
        ],
      },
    ],
  },
  {
    path: "/pesquisa/:id",
    Component: PublicSurveyPage,
  },
  {
    path: "/dados-publicos",
    Component: PublicStatsPage,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
