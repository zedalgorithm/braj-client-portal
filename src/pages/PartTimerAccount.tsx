import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchPartTimerRatings } from "@/lib/parttimer-ratings";
import { Loader2, ArrowLeft, User, Banknote, History, CheckCircle, Check, Mail, Phone, CreditCard, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OrderWithProfile = Tables<"orders"> & { profiles?: { full_name: string; email: string } | null };
type ProfileRow = Tables<"profiles">;

export default function PartTimerAccount() {
  const { user, isPartTimer, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [payments, setPayments] = useState<Tables<"transactions">[]>([]);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isPartTimer)) navigate("/auth");
  }, [user, isPartTimer, isLoading, navigate]);

  useEffect(() => {
    if (!user || !isPartTimer) return;
    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setProfile(profileData || null);

        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (ordersData?.length) {
          const userIds = [...new Set(ordersData.map((o) => o.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name, email")
            .in("user_id", userIds);
          const profileMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);
          setOrders(
            ordersData.map((o) => ({
              ...o,
              profiles: profileMap.get(o.user_id) || null,
            }))
          );
        } else {
          setOrders([]);
        }

        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false });
        setPayments(txData || []);
        const ratings = await fetchPartTimerRatings([user.id]);
        const r = ratings.get(user.id);
        setRating(r ?? null);
      } catch {
        setProfile(null);
        setOrders([]);
        setPayments([]);
        setRating(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isPartTimer]);

  const completedByMe = orders.filter((o) => o.status === "completed" && o.assigned_to === user?.id);

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
      <main className="flex-1 py-6 sm:py-8">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
              <Link to="/parttimer"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Account</h1>
          </div>

          {/* Account details */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account details
            </h2>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-base font-semibold">Profile</CardTitle>
                <CardDescription>Your part-timer account information</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                    <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      Complete name
                    </dt>
                    <dd className="text-sm font-medium flex items-center gap-2">
                      {profile?.full_name || "—"}
                      {rating && (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-normal">
                          <Star className="h-4 w-4 fill-amber-500" /> {rating.avg} ({rating.count} ratings)
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                    <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      Email
                    </dt>
                    <dd className="text-sm">{profile?.email || user?.email || "—"}</dd>
                  </div>
                  {(profile?.gcash_number || profile?.gcash_name) ? (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                        <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0" />
                          GCash number
                        </dt>
                        <dd className="text-sm font-mono tracking-wide">{profile?.gcash_number || "—"}</dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                        <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                          <CreditCard className="h-4 w-4 shrink-0" />
                          GCash name
                        </dt>
                        <dd className="text-sm">{profile?.gcash_name || "—"}</dd>
                      </div>
                    </>
                  ) : (
                    <div className="px-6 py-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4 shrink-0" />
                        GCash details not on file.
                      </p>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Payment history */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Payment history
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Your share from confirmed payments (admin pays you this amount).</p>
            {payments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No payments yet. Payments appear here after the admin confirms client payment for orders you completed.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left py-2 px-2 sm:px-3 whitespace-nowrap">Date</th>
                            <th className="text-left py-2 px-2 sm:px-3">Order</th>
                            <th className="text-right py-2 px-2 sm:px-3 whitespace-nowrap">Order total</th>
                            <th className="text-right py-2 px-2 sm:px-3 font-medium whitespace-nowrap">Your share</th>
                            <th className="text-center py-2 px-2 sm:px-3 whitespace-nowrap">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((t) => (
                            <tr key={t.id} className="border-b last:border-0">
                              <td className="py-2 px-2 sm:px-3 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                              <td className="py-2 px-2 sm:px-3 max-w-[150px] truncate" title={orders.find((o) => o.id === t.order_id)?.title ?? "—"}>{orders.find((o) => o.id === t.order_id)?.title ?? "—"}</td>
                              <td className="text-right py-2 px-2 sm:px-3 whitespace-nowrap">₱{Number(t.amount).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 sm:px-3 font-medium text-green-700 whitespace-nowrap">₱{Number(t.parttimer_amount).toLocaleString()}</td>
                              <td className="text-center py-2 px-2 sm:px-3">
                                {t.parttimer_paid_at ? (
                                  <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
                                    <Check className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Paid by admin</span><span className="sm:hidden">Paid</span>
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Completed order history */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <History className="h-5 w-5" />
              Completed order history
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Orders you completed (payment status shown).</p>
            {completedByMe.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No completed orders yet.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {completedByMe.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{order.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.service_type} — {order.profiles?.full_name || order.profiles?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Completed {new Date(order.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {order.payment_received ? (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" /> Paid
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Awaiting payment</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
