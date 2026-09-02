CREATE TABLE public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications readable" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications updatable" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications deletable" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_seller_on_enquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_seller uuid; v_title text;
BEGIN
  SELECT seller_id, company || ' ' || model INTO v_seller, v_title
  FROM public.vehicles WHERE id = NEW.vehicle_id;
  IF v_seller IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_seller, 'enquiry_received', 'New enquiry on ' || coalesce(v_title,'your listing'),
            coalesce(NEW.name,'A buyer') || ' is interested in your vehicle.', '/enquiries');
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_seller_on_enquiry() FROM public, anon, authenticated;

CREATE TRIGGER enquiries_notify_seller
AFTER INSERT ON public.enquiries
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_on_enquiry();

CREATE OR REPLACE FUNCTION public.notify_buyer_on_enquiry_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.buyer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.buyer_id, 'enquiry_status', 'Your enquiry was updated',
            'The seller marked your enquiry as ' || NEW.status || '.', '/enquiries');
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_buyer_on_enquiry_status() FROM public, anon, authenticated;

CREATE TRIGGER enquiries_notify_buyer
AFTER UPDATE ON public.enquiries
FOR EACH ROW EXECUTE FUNCTION public.notify_buyer_on_enquiry_status();

CREATE OR REPLACE FUNCTION public.notify_seller_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.seller_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.seller_id, 'listing_' || NEW.verification_status,
            CASE WHEN NEW.verification_status = 'verified'
                 THEN 'Listing verified: ' || NEW.company || ' ' || NEW.model
                 WHEN NEW.verification_status = 'rejected'
                 THEN 'Listing rejected: ' || NEW.company || ' ' || NEW.model
                 ELSE 'Listing status updated' END,
            CASE WHEN NEW.verification_status = 'verified'
                 THEN 'Your listing is now live on CarAdda.'
                 ELSE coalesce(NEW.rejection_reason, 'Please review and resubmit your listing.') END,
            '/listings');
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_seller_on_verification() FROM public, anon, authenticated;

CREATE TRIGGER vehicles_notify_verification
AFTER UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_on_verification();