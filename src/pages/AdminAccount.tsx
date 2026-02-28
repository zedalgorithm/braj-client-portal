import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, User, Mail, Phone } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ProfileRow = Tables<"profiles">;

export default function AdminAccount() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!user) navigate("/auth");
      else if (!isAdmin) navigate("/dashboard");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const loadProfile = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, isAdmin]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updates = {
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
    };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setProfile((prev) =>
      prev
        ? { ...prev, ...updates }
        : ({
            email: user.email ?? "",
            user_id: user.id,
            id: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            full_name: updates.full_name ?? "",
            phone: updates.phone,
            gcash_name: null,
            gcash_number: null,
          } as ProfileRow)
    );
    setEditing(false);
    toast({ title: "Profile updated" });
  };

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
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Admin Profile</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Account details
            </h2>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 items-start gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">Profile</CardTitle>
                  <CardDescription>Your admin account information</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing((prev) => !prev)}
                >
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {editing ? (
                  <form
                    className="space-y-4 px-6 py-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!saving) handleSave();
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="admin-full-name">Full name</Label>
                      <Input
                        id="admin-full-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        value={profile?.email || user?.email || ""}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-phone">Phone number (optional)</Label>
                      <Input
                        id="admin-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          if (profile) {
                            setFullName(profile.full_name || "");
                            setPhone(profile.phone || "");
                          }
                          setEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Save changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <dl className="divide-y">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                      <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0" />
                        Full name
                      </dt>
                      <dd className="text-sm font-medium">
                        {profile?.full_name || "—"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                      <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        Email
                      </dt>
                      <dd className="text-sm">
                        {profile?.email || user?.email || "—"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4">
                      <dt className="text-sm font-medium text-muted-foreground min-w-[140px] flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" />
                        Phone number
                      </dt>
                      <dd className="text-sm">
                        {profile?.phone || "—"}
                      </dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

