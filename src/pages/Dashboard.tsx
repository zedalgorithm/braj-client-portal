import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Download, Plus, Clock, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  const [files, setFiles] = useState<Tables<"order_files">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map((o) => o.id);
        const { data: filesData } = await supabase
          .from("order_files")
          .select("*")
          .in("order_id", orderIds);
        setFiles(filesData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const downloadFile = async (filePath: string, fileName: string, bucket: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = orders.find((o) => o.id === selectedOrder);
  const selectedFiles = files.filter((f) => f.order_id === selectedOrder);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <Button asChild>
              <a href="/order"><Plus className="h-4 w-4 mr-1" /> New Order</a>
            </Button>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet. Place your first order to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Order List */}
              <div className="lg:col-span-2 space-y-3">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${selectedOrder === order.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">{order.service_type} — {order.pricing_tier}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Detail */}
              <div>
                {selected ? (
                  <Card className="sticky top-20">
                    <CardHeader>
                      <CardTitle className="text-lg">{selected.title}</CardTitle>
                      <CardDescription>{selected.service_type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div><strong>Tier:</strong> {selected.pricing_tier}</div>
                      <div><strong>Status:</strong> <Badge className={statusColors[selected.status]}>{statusLabels[selected.status]}</Badge></div>
                      {selected.instructions && <div><strong>Instructions:</strong> {selected.instructions}</div>}
                      {selected.deadline && <div><strong>Deadline:</strong> {selected.deadline}</div>}
                      {selected.chapter_count && <div><strong>Chapters:</strong> {selected.chapter_count}</div>}
                      {selected.word_count && <div><strong>Word Count:</strong> {selected.word_count}</div>}

                      {selectedFiles.length > 0 && (
                        <div>
                          <strong>Files:</strong>
                          <div className="mt-2 space-y-1">
                            {selectedFiles.map((f) => (
                              <Button
                                key={f.id}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={() => downloadFile(f.file_path, f.file_name, f.file_type === "input" ? "input-files" : "output-files")}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {f.file_name} ({f.file_type})
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      Select an order to view details
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
