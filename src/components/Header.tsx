import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, LogOut, LayoutDashboard, User } from "lucide-react";

export function Header() {
  const { user, isAdmin, isPartTimer, isPendingPartTimer, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dashboardLink = isAdmin ? "/admin" : isPartTimer ? "/parttimer" : isPendingPartTimer ? "/pending-parttimer" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <BarChart3 className="h-6 w-6" />
          BRAJ Consultancy
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardLink}>
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  {isPendingPartTimer ? "Pending approval" : "Dashboard"}
                </Link>
              </Button>
              {isPartTimer && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/parttimer/account">
                    <User className="h-4 w-4 mr-1" />
                    Account
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?tab=signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
