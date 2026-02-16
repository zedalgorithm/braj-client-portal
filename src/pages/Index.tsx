import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { SERVICES } from "@/lib/services";
import { ArrowRight, BarChart3, FileText, CheckCircle, Edit3, Search } from "lucide-react";

const serviceIcons: Record<string, React.ReactNode> = {
  "statistical-analysis": <BarChart3 className="h-8 w-8" />,
  "research": <FileText className="h-8 w-8" />,
  "turnitin-check": <Search className="h-8 w-8" />,
  "paraphrasing": <Edit3 className="h-8 w-8" />,
  "editing": <CheckCircle className="h-8 w-8" />,
};

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-primary py-24 text-primary-foreground">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            BRAJ Statistical &amp; Research Consultancy
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">
            Professional statistical analysis, research assistance, and academic support services to help you succeed.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to={user ? "/dashboard" : "/auth?tab=signup"}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Services */}
      <section className="py-20" id="services">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Card key={service.id} className="flex flex-col">
                <CardHeader>
                  <div className="text-primary mb-2">{serviceIcons[service.id]}</div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    {service.tiers.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between text-sm">
                        <span>{tier.name}</span>
                        <Badge variant={tier.priceValue > 0 ? "default" : "secondary"}>{tier.price}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link to={user ? `/order?service=${service.id}` : "/auth"}>
                      Place Order
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
