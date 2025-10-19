import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "./pages/NotFound";
import Auth from "./components/Auth";
import NovelList from "./components/NovelList";
import CreateNovel from "./components/CreateNovel";
import NovelDetail from "./components/NovelDetail";
import EpisodeWriter from "./components/EpisodeWriter";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {!session ? (
              <>
                <Route path="/" element={<Auth />} />
                <Route path="*" element={<Auth />} />
              </>
            ) : (
              <>
                <Route path="/" element={<NovelList />} />
                <Route path="/novel/new" element={<CreateNovel />} />
                <Route path="/novel/:id" element={<NovelDetail />} />
                <Route path="/novel/:id/episode/new" element={<EpisodeWriter />} />
                <Route path="/novel/:id/episode/:episodeId" element={<EpisodeWriter />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
