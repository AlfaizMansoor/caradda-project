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
            coalesce(NEW.buyer_name,'A buyer') || ' is interested in your vehicle.', '/enquiries');
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_seller_on_enquiry() FROM public, anon, authenticated;