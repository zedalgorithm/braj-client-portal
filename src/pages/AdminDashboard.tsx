import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Loader2, Search } from "lucide-react";
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

type OrderWithProfile = Tables<"orders"> & { profiles?: { full_name: string; email: string } | null };

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [files, setFiles] = useState<Tables<"order_files">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, isLoading, navigate]);

  const fetchData = async () => {
    // Fetch orders - profiles join may not work due to RLS, so we fetch separately
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersData && ordersData.length > 0) {
      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(ordersData.map((o) => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

      const enriched = ordersData.map((o) => ({
        ...o,
        profiles: profileMap.get(o.user_id) || null,
      }));
      setOrders(enriched);

      const orderIds = ordersData.map((o) => o.id);
      const { data: filesData } = await supabase
        .from("order_files")
        .select("*")
        .in("order_id", orderIds);
      setFiles(filesData || []);
    } else {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const updateStatus = async (orderId: string, status: "pending" | "in_progress" | "completed") => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      toast({ title: "Status updated" });
    }
  };

  const togglePayment = async (orderId: string, current: boolean) => {
    const { error } = await supabase.from("orders").update({ payment_received: !current }).eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_received: !current } : o)));
    }
  };

  const uploadOutputFile = async (orderId: string, file: File) => {
    if (!user) return;
    // For output files, use the order's user_id as folder
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const filePath = `${order.user_id}/${orderId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("output-files").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { error: dbError } = await supabase.from("order_files").insert({
      order_id: orderId,
      file_type: "output" as const,
      file_path: filePath,
      file_name: file.name,
      uploaded_by: user.id,
    });

    if (dbError) {
      toast({ title: "Error", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "File uploaded" });
      fetchData();
    }
  };

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

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (serviceFilter !== "all" && o.service_type !== serviceFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        o.title.toLowerCase().includes(s) ||
        o.profiles?.full_name?.toLowerCase().includes(s) ||
        o.profiles?.email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const selected = orders.find((o) => o.id === selectedOrder);
  const selectedFiles = files.filter((f) => f.order_id === selectedOrder);
  const serviceTypes = [...new Set(orders.map((o) => o.service_type))];

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
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceTypes.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No orders found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                {filtered.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${selectedOrder === order.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.service_type} — {order.profiles?.full_name || order.profiles?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                          {order.payment_received && <Badge variant="outline" className="text-xs">Paid</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                {selected ? (
                  <Card className="sticky top-20">
                    <CardHeader>
                      <CardTitle className="text-lg">{selected.title}</CardTitle>
                      <CardDescription>
                        {selected.service_type} — {selected.profiles?.full_name || "Unknown"}
                        <br />{selected.profiles?.email}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div><strong>Tier:</strong> {selected.pricing_tier}</div>
                      {selected.instructions && <div><strong>Instructions:</strong> {selected.instructions}</div>}
                      {selected.deadline && <div><strong>Deadline:</strong> {selected.deadline}</div>}
                      {selected.chapter_count && <div><strong>Chapters:</strong> {selected.chapter_count}</div>}
                      {selected.word_count && <div><strong>Word Count:</strong> {selected.word_count}</div>}

                      {/* Status Update */}
                      <div className="space-y-2">
                        <strong>Update Status:</strong>
                        <Select
                          value={selected.status}
                          onValueChange={(v) => updateStatus(selected.id, v as any)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Payment Toggle */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selected.payment_received}
                          onCheckedChange={() => togglePayment(selected.id, selected.payment_received)}
                        />
                        <span>Payment Received</span>
                      </div>

                      {/* Files */}
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

                      {/* Upload Output */}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => document.getElementById(`upload-${selected.id}`)?.click()}
                        >
                          <Upload className="h-3 w-3 mr-1" /> Upload Output File
                        </Button>
                        <input
                          id={`upload-${selected.id}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadOutputFile(selected.id, file);
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      Select an order to manage
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
