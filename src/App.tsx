import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";

import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTracking } from "./hooks/useTracking";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error(error);
    },
  }),
});

function AuthenticatedApp() {
  const { i18n } = useTranslation();
  const hasSynced = useRef(false);
  const { isTracking, startTracking } = useTracking();

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  useEffect(() => {
    if (!hasSynced.current) {
      window.electronWindow.getActivities().then((activities) => {
        hasSynced.current = true;
        // window.electronWindow.clearActivities();
        console.log("isTracking", isTracking);
        if (isTracking) {
          startTracking();
        }
      });
    }
  }, [isTracking, startTracking]);

  return <RouterProvider router={router} />;
}

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    async function signInAnonymously() {
      console.log("user", user);
      console.log("loading", loading);
      if (!loading && !user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (localStorage.getItem("supabase.auth.user")) {
          console.error(
            `already signed in as ${localStorage.getItem("supabase.auth.user")} new user: ${data.user?.id}`
          );
        }
        if (data.user?.id) {
          localStorage.setItem("supabase.auth.user", data.user.id);
        }
        if (error) {
          console.error("Error signing in anonymously:", error.message);
        }
      }
    }
    signInAnonymously();
  }, [user]);
  console.log("user", user);
  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <AuthenticatedApp />
      </QueryClientProvider>
    </TooltipProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
