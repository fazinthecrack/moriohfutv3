import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Packs from "./pages/Packs";
import Market from "./pages/Market";
import Lineup from "./pages/Lineup";
import Inventory from "./pages/Inventory";
import Versus from "./pages/Versus";
import Auth from "./pages/Auth";
import Showcase from "./pages/Showcase";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { PotmBanner } from "@/components/PotmBanner";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <Layout><PotmBanner />{children}</Layout>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/packs" element={<ProtectedRoute><Packs /></ProtectedRoute>} />
    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
    <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
    <Route path="/lineup" element={<ProtectedRoute><Lineup /></ProtectedRoute>} />
    <Route path="/versus" element={<ProtectedRoute><Versus /></ProtectedRoute>} />
    <Route path="/showcase" element={<ProtectedRoute><Showcase /></ProtectedRoute>} />
    <Route path="/admin" element={<Admin />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
