
-- ROLES
CREATE TYPE public.app_role AS ENUM ('buyer','seller','admin');
CREATE TYPE public.vehicle_category AS ENUM ('car','bike','truck','bus','tractor','commercial','other');
CREATE TYPE public.listing_status AS ENUM ('draft','active','sold','inactive','suspended');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.enquiry_status AS ENUM ('new','contacted','in_progress','closed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  address text,
  city text,
  state text,
  phone_verified boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, email_verified)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email,
          NEW.raw_user_meta_data->>'phone', NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VEHICLES
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.vehicle_category NOT NULL,
  company text NOT NULL,
  model text NOT NULL,
  variant text,
  manufacturing_year int NOT NULL CHECK (manufacturing_year BETWEEN 1950 AND 2100),
  registration_year int,
  vehicle_number text,
  chassis_number text,
  engine_number text,
  mileage int NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  fuel_type text NOT NULL DEFAULT 'petrol',
  transmission text NOT NULL DEFAULT 'manual',
  ownership text NOT NULL DEFAULT 'first',
  condition text NOT NULL DEFAULT 'good',
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  location text NOT NULL,
  description text,
  status public.listing_status NOT NULL DEFAULT 'draft',
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_public_idx ON public.vehicles (status, verification_status, created_at DESC);
CREATE INDEX vehicles_seller_idx ON public.vehicles (seller_id);
CREATE INDEX vehicles_cat_idx ON public.vehicles (category);
CREATE INDEX vehicles_price_idx ON public.vehicles (price);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can view live listings" ON public.vehicles FOR SELECT TO anon, authenticated
  USING (status = 'active' AND verification_status = 'verified');
CREATE POLICY "sellers view own listings" ON public.vehicles FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sellers create listings" ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());
CREATE POLICY "sellers update own listings" ON public.vehicles FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "sellers delete own listings" ON public.vehicles FOR DELETE TO authenticated
  USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.vehicle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_images_vehicle_idx ON public.vehicle_images (vehicle_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
GRANT SELECT ON public.vehicle_images TO anon;
GRANT ALL ON public.vehicle_images TO service_role;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public view images of live listings" ON public.vehicle_images FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.status='active' AND v.verification_status='verified'));
CREATE POLICY "owners view own images" ON public.vehicle_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND (v.seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "owners manage images" ON public.vehicle_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND (v.seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND (v.seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- max 10 images trigger
CREATE OR REPLACE FUNCTION public.enforce_image_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.vehicle_images WHERE vehicle_id = NEW.vehicle_id) >= 10 THEN
    RAISE EXCEPTION 'A listing can have at most 10 images';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER vehicle_images_limit BEFORE INSERT ON public.vehicle_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_image_limit();

CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('CA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text NOT NULL,
  message text,
  preferred_contact text NOT NULL DEFAULT 'phone',
  status public.enquiry_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiries_seller_idx ON public.enquiries (seller_id, created_at DESC);
CREATE INDEX enquiries_buyer_idx ON public.enquiries (buyer_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parties view enquiries" ON public.enquiries FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "buyers create enquiries" ON public.enquiries FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "seller or admin update enquiry" ON public.enquiries FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (seller_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vehicle_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own favorites" ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  secure_file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or admin documents" ON public.documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner insert documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner delete documents" ON public.documents FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER vehicles_touch BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
