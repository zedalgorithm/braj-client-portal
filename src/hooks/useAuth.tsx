import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isPartTimer: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, asPartTimer?: boolean, gcashNumber?: string, gcashName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartTimer, setIsPartTimer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkRolesWithTimeout = async (userId: string) => {
    try {
      await Promise.race([
        (async () => {
          const [adminRes, partTimerRes] = await Promise.all([
            supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
            supabase.rpc("has_role", { _user_id: userId, _role: "parttimer" }),
          ]);
          setIsAdmin(!!adminRes.data);
          setIsPartTimer(!!partTimerRes.data);
        })(),
        new Promise((r) => setTimeout(r, 5000)),
      ]);
    } catch {
      setIsAdmin(false);
      setIsPartTimer(false);
    }
  };

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(finish, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkRolesWithTimeout(session.user.id);
        } else {
          setIsAdmin(false);
          setIsPartTimer(false);
        }
        finish();
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      try {
        if (session?.user) {
          await checkRolesWithTimeout(session.user.id);
        } else {
          setIsAdmin(false);
          setIsPartTimer(false);
        }
      } finally {
        finish();
      }
    }).finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, asPartTimer?: boolean, gcashNumber?: string, gcashName?: string) => {
    const meta: Record<string, unknown> = { full_name: fullName, signup_as_parttimer: !!asPartTimer };
    if (asPartTimer) {
      if (gcashNumber) meta.gcash_number = gcashNumber;
      if (gcashName) meta.gcash_name = gcashName;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isPartTimer, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
