import { AppLayout } from "../../components/AppLayout";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Visualizar", path: "/pesquisador" },
  { label: "Responder pesquisa", path: "/pesquisador/responder" },
];

export function ResearcherLayout() {
  const { user } = useAuth();
  return (
    <AppLayout
      navItems={NAV_ITEMS}
      homePath="/pesquisador"
      roleBadge="Pesquisador"
      userName={user?.nome ?? "Pesquisador"}
      userEmail=""
    />
  );
}
