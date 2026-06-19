import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";
import { ChatLauncher } from "@/components/chat/ChatLauncher";

// Lazy load page components for code splitting
const Home = lazy(() => import("./pages/Home"));
const Work = lazy(() => import("./pages/Work"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const LoadingFallback = () => (
  <Layout>
    <div className="h-full flex items-center justify-center px-4 sm:px-8 lg:px-12">
      <GallerySkeleton />
    </div>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <PortfolioProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/work" element={<Work />} />
                <Route path="/work/:type" element={<Work />} />
                <Route path="/project/:slug" element={<ProjectDetail />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<PostDetail />} />
                <Route path="/about" element={<About />} />
                {/* Legacy photography routes */}
                <Route path="/series/:slug" element={<Navigate to="/work" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ChatLauncher />
          </PortfolioProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
