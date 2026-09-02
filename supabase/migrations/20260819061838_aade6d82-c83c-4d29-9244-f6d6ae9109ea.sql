REVOKE EXECUTE ON FUNCTION public.get_listing_seller(uuid) FROM anon, authenticated;

DROP POLICY IF EXISTS "vehicle images readable" ON storage.objects;

CREATE POLICY "public read images of live listings"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'vehicle-images'
  AND EXISTS (
    SELECT 1
    FROM public.vehicle_images vi
    JOIN public.vehicles v ON v.id = vi.vehicle_id
    WHERE v.status = 'active'
      AND v.verification_status = 'verified'
      AND vi.image_url LIKE '%' || storage.objects.name || '%'
  )
);

CREATE POLICY "owners read own vehicle images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vehicle-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);