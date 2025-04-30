import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./pages/RootLayout";
import AssistantPage from "./pages/Assistant";
import VectorstorePage, { loader as documentLoader } from "./pages/Vectorstore";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <AssistantPage /> },
      {
        path: "/vector-store",
        element: <VectorstorePage />,
        loader: documentLoader,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
