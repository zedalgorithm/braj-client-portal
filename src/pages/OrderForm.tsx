import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES } from "@/lib/services";
import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export default function OrderForm() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("service") || "";
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [serviceId, setServiceId] = useState(preselected);
  const [tierId, setTierId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [chapterCount, setChapterCount] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  const service = SERVICES.find((s) => s.id === serviceId);

  const handleSubmit = async () => {
    if (!user || !service) return;
    setSubmitting(true);

    try {
      const tier = service.tiers.find((t) => t.name === tierId) || service.tiers[0];

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          service_type: service.name,
          pricing_tier: tier.name,
          title,
          instructions,
          deadline: deadline || null,
          chapter_count: chapterCount ? parseInt(chapterCount) : null,
          word_count: wordCount ? parseInt(wordCount) : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Upload files
      for (const file of files) {
        const filePath = `${user.id}/${order.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("input-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        await supabase.from("order_files").insert({
          order_id: order.id,
          file_type: "input" as const,
          file_path: filePath,
          file_name: file.name,
          uploaded_by: user.id,
        });
      }

      toast({ title: "Order placed!", description: "Your order has been submitted successfully." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-lg">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Order</CardTitle>
                <CardDescription>Please review the details before submitting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><strong>Service:</strong> {service?.name}</div>
                <div><strong>Tier:</strong> {tierId || service?.tiers[0]?.name}</div>
                <div><strong>Title:</strong> {title}</div>
                {instructions && <div><strong>Instructions:</strong> {instructions}</div>}
                {deadline && <div><strong>Deadline:</strong> {deadline}</div>}
                {chapterCount && <div><strong>Chapters:</strong> {chapterCount}</div>}
                {wordCount && <div><strong>Word Count:</strong> {wordCount}</div>}
                {files.length > 0 && (
                  <div><strong>Files:</strong> {files.map((f) => f.name).join(", ")}</div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                    Go Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                    {submitting ? "Submitting..." : "Submit Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Place an Order</CardTitle>
              <CardDescription>Fill out the form below to place your order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTierId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {service && service.tiers.length > 1 && (
                <div className="space-y-2">
                  <Label>Pricing Tier</Label>
                  <Select value={tierId} onValueChange={setTierId}>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      {service.tiers.map((t) => (
                        <SelectItem key={t.name} value={t.name}>{t.name} — {t.price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" required />
              </div>

              <div className="space-y-2">
                <Label>Instructions / Notes</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Any specific instructions..." />
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>

              {service?.hasChapterCount && (
                <div className="space-y-2">
                  <Label>Chapter Count</Label>
                  <Input type="number" value={chapterCount} onChange={(e) => setChapterCount(e.target.value)} min={1} />
                </div>
              )}

              {service?.hasWordCount && (
                <div className="space-y-2">
                  <Label>Word Count</Label>
                  <Input type="number" value={wordCount} onChange={(e) => setWordCount(e.target.value)} min={1} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Upload Files</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById("file-input")?.click()}>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {files.length > 0 ? `${files.length} file(s) selected` : "Click to upload files"}
                  </p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => setShowConfirm(true)}
                disabled={!serviceId || !title}
              >
                Review Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
