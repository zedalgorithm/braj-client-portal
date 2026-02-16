
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.file_type AS ENUM ('input', 'output');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  pricing_tier TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  instructions TEXT DEFAULT '',
  deadline DATE,
  chapter_count INTEGER,
  word_count INTEGER,
  status order_status NOT NULL DEFAULT 'pending',
  payment_received BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order files table
CREATE TABLE public.order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  file_type file_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + client role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE POLICY "Clients see own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order files
CREATE POLICY "View order files" ON public.order_files FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
CREATE POLICY "Upload input files" ON public.order_files FOR INSERT TO authenticated
  WITH CHECK (
    (uploaded_by = auth.uid() AND file_type = 'input' AND order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()))
    OR (uploaded_by = auth.uid() AND file_type = 'output' AND public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Delete files" ON public.order_files FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR uploaded_by = auth.uid());

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('input-files', 'input-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('output-files', 'output-files', false);

-- Storage policies for input-files
CREATE POLICY "Clients upload input files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'input-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own input files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'input-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users delete own input files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'input-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Storage policies for output-files
CREATE POLICY "Admins upload output files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'output-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "View output files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'output-files' AND (public.has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]));
CREATE POLICY "Admins delete output files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'output-files' AND public.has_role(auth.uid(), 'admin'));
