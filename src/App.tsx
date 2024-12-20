import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { config } from "./config/env";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BoardProvider } from "./context/BoardContext";

const convex = new ConvexReactClient(config.convexUrl);

function AuthenticatedApp() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);
  }, [i18n]);

  return <RouterProvider router={router} />;
}

export default function App() {
  const userQuery = useQuery(api.users.viewer);
  const { signIn, signOut } = useAuthActions();

  useEffect(() => {
    // Skip if the query is still loading
    if (userQuery === undefined) return;

    if (!userQuery) {
      console.log("signing in");

      void signIn("anonymous");
    } else {
      console.log("user is authenticated:", userQuery);
    }
  }, [signIn, userQuery]);

  return (
    <>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
    </>
  );
}

const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BoardProvider>
            <App />
          </BoardProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ConvexAuthProvider>
  </React.StrictMode>
);
