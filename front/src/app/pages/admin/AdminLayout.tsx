import { AppLayout } from "../../components/AppLayout";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Visualizar", path: "/admin" },
  { label: "Diária média", path: "/admin/diaria-media" },
  { label: "Consultar", path: "/admin/consultar" },
  { label: "Adicionar pesquisa", path: "/admin/adicionar-pesquisa" },
  { label: "Usuários", path: "/admin/usuarios" },
];

export function AdminLayout() {
  const { user } = useAuth();
  return (
    <AppLayout
      navItems={NAV_ITEMS}
      homePath="/admin"
      userName={user?.nome ?? "Administrador"}
      userEmail=""
    />
  );
}
