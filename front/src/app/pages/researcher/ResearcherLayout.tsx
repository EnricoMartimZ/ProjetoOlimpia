import { AppLayout } from "../../components/AppLayout";

const NAV_ITEMS = [
  { label: "Visualizar", path: "/pesquisador" },
  { label: "Responder pesquisa", path: "/pesquisador/responder" },
  { label: "Nova pesquisa", path: "/pesquisador/nova-pesquisa" },
];

export function ResearcherLayout() {
  return (
    <AppLayout
      navItems={NAV_ITEMS}
      homePath="/pesquisador"
      roleBadge="Pesquisador"
      userName="Ana Paula Silva"
      userEmail="pesquisador@olimpia.sp.gov.br"
    />
  );
}
