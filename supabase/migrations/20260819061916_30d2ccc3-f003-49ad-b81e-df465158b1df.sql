CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = private, public;

ALTER FUNCTION public.get_listing_seller(uuid) SET SCHEMA private;