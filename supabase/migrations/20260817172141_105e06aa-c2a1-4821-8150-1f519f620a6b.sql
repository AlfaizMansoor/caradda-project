
ALTER TABLE public.profiles
  ADD COLUMN member_id text UNIQUE,
  ADD COLUMN avatar_url text;

UPDATE public.profiles
SET member_id = 'CA-' || upper(substr(replace(id::text,'-',''),1,8))
WHERE member_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_member_id()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.member_id IS NULL THEN
    NEW.member_id := 'CA-' || upper(substr(replace(NEW.id::text,'-',''),1,8));
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.set_member_id() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_member_id BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_member_id();

GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "become a seller" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'seller');
CREATE POLICY "admins manage roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins remove roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- public-safe seller summary for a listing
CREATE OR REPLACE FUNCTION public.get_listing_seller(_vehicle_id uuid)
RETURNS TABLE (display_name text, city text, state text, member_id text, verified boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(p.full_name,''),'CarAdda Seller'), p.city, p.state, p.member_id,
         (p.email_verified AND p.phone_verified)
  FROM public.vehicles v
  LEFT JOIN public.profiles p ON p.id = v.seller_id
  WHERE v.id = _vehicle_id AND v.status='active' AND v.verification_status='verified'
$$;
REVOKE ALL ON FUNCTION public.get_listing_seller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_seller(uuid) TO anon, authenticated, service_role;
