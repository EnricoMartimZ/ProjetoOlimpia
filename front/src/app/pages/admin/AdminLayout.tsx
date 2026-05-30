import { AppLayout } from "../../components/AppLayout";

const NAV_ITEMS = [
  { label: "Visualizar", path: "/admin" },
  { label: "Diária média", path: "/admin/diaria-media" },
  { label: "Consultar", path: "/admin/consultar" },
  { label: "Adicionar pesquisa", path: "/admin/adicionar-pesquisa" },
];

export function AdminLayout() {
  return (
    <AppLayout
      navItems={NAV_ITEMS}
      homePath="/admin"
      userName="Administrador"
      userEmail="adm@olimpia.sp.gov.br"
    />
  );
}
