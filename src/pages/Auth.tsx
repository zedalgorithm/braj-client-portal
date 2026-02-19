import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { BarChart3 } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const isPartTimerSignup = searchParams.get("parttimer") === "1";
  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, isPartTimer, isPendingPartTimer, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || isLoading) return;
    if (isAdmin) navigate("/admin");
    else if (isPartTimer) navigate("/parttimer");
    else if (isPendingPartTimer) navigate("/pending-parttimer");
    else navigate("/dashboard");
  }, [user, isAdmin, isPartTimer, isPendingPartTimer, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName, isPartTimerSignup, isPartTimerSignup ? gcashNumber : undefined, isPartTimerSignup ? gcashName : undefined);
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created!",
        description: isPartTimerSignup
          ? "Your part-timer application was submitted. You can log in after email verification, but you’ll need admin approval before you can access the part-timer dashboard."
          : "Please check your email to verify your account.",
      });
      setTab("login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle>Welcome to BRAJ</CardTitle>
            <CardDescription>
            {isPartTimerSignup ? "Sign up to become a part-timer and work on client orders." : "Statistical & Research Consultancy"}
          </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{isPartTimerSignup ? "Complete name" : "Full Name"}</Label>
                    <Input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  {isPartTimerSignup && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-gcash-number">GCash number</Label>
                        <Input id="signup-gcash-number" type="tel" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="e.g. 09171234567" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-gcash-name">GCash name</Label>
                        <Input id="signup-gcash-name" value={gcashName} onChange={(e) => setGcashName(e.target.value)} placeholder="Name on GCash account" required />
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : isPartTimerSignup ? "Sign Up as Part-timer" : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
