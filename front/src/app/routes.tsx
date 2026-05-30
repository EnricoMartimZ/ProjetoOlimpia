import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { DiariaMediaPage } from "./pages/admin/DiariaMediaPage";
import { ConsultarPage } from "./pages/admin/ConsultarPage";
import { AdicionarPesquisaPage } from "./pages/admin/AdicionarPesquisaPage";
import { ResearcherLayout } from "./pages/researcher/ResearcherLayout";
import { ResearcherDashboard } from "./pages/researcher/ResearcherDashboard";
import { ResponderPage } from "./pages/researcher/ResponderPage";
import { NovaPesquisaPage } from "./pages/researcher/NovaPesquisaPage";
import { PublicSurveyPage } from "./pages/PublicSurveyPage";
import { PublicStatsPage } from "./pages/PublicStatsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "diaria-media", Component: DiariaMediaPage },
      { path: "consultar", Component: ConsultarPage },
      { path: "adicionar-pesquisa", Component: AdicionarPesquisaPage },
    ],
  },
  {
    path: "/pesquisador",
    Component: ResearcherLayout,
    children: [
      { index: true, Component: ResearcherDashboard },
      { path: "responder", Component: ResponderPage },
      { path: "nova-pesquisa", Component: NovaPesquisaPage },
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
