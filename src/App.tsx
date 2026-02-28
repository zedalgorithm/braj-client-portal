import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OrderForm from "./pages/OrderForm";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccount from "./pages/AdminAccount";
import AdminTransactions from "./pages/AdminTransactions";
import PartTimerDashboard from "./pages/PartTimerDashboard";
import PartTimerAccount from "./pages/PartTimerAccount";
import PendingPartTimer from "./pages/PendingPartTimer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/account" element={<AdminAccount />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/parttimer" element={<PartTimerDashboard />} />
            <Route path="/parttimer/account" element={<PartTimerAccount />} />
            <Route path="/pending-parttimer" element={<PendingPartTimer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
