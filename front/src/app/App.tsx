import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppStoreProvider } from "./context/AppStore";

export default function App() {
  return (
    <AppStoreProvider>
      <RouterProvider router={router} />
    </AppStoreProvider>
  );
}
