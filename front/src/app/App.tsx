import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppStoreProvider } from "./context/AppStore";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppStoreProvider>
        <RouterProvider router={router} />
      </AppStoreProvider>
    </AuthProvider>
  );
}
