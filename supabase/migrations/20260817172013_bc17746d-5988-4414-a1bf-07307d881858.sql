
ALTER TABLE public.vehicles ALTER COLUMN seller_id DROP NOT NULL;

-- storage: vehicle images
CREATE POLICY "vehicle images readable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'vehicle-images');
CREATE POLICY "sellers upload vehicle images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "sellers update own vehicle images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "sellers delete own vehicle images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- storage: private documents
CREATE POLICY "owner read documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'seller-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "owner upload documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'seller-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner delete documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'seller-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

-- sample listings
INSERT INTO public.vehicles (id, seller_id, category, company, model, variant, manufacturing_year, registration_year, mileage, fuel_type, transmission, ownership, condition, price, location, description, status, verification_status)
VALUES
 ('11111111-1111-4111-8111-111111111101', NULL, 'car','Maruti Suzuki','Swift','VXi',2021,2021,32000,'petrol','manual','first','excellent',624000,'Pune, Maharashtra','Single owner Swift VXi, full service history, new tyres.','active','verified'),
 ('11111111-1111-4111-8111-111111111102', NULL, 'car','Hyundai','Creta','SX(O) Turbo',2022,2022,28500,'petrol','automatic','first','excellent',1685000,'Bengaluru, Karnataka','Top variant Creta with panoramic sunroof and ADAS-ready package.','active','verified'),
 ('11111111-1111-4111-8111-111111111103', NULL, 'bike','Royal Enfield','Classic 350','Halcyon',2023,2023,9800,'petrol','manual','first','excellent',178000,'Jaipur, Rajasthan','Barely used Classic 350, showroom condition with touring accessories.','active','verified'),
 ('11111111-1111-4111-8111-111111111104', NULL, 'truck','Tata Motors','Signa 2823.K','Tipper',2019,2019,145000,'diesel','manual','second','good',2450000,'Raipur, Chhattisgarh','Well maintained tipper, ideal for construction fleets. Fitness valid.','active','verified'),
 ('11111111-1111-4111-8111-111111111105', NULL, 'tractor','Mahindra','575 DI XP Plus','45 HP',2020,2020,3200,'diesel','manual','first','good',612000,'Ludhiana, Punjab','45 HP workhorse, low hours, all implements compatible.','active','verified'),
 ('11111111-1111-4111-8111-111111111106', NULL, 'bus','Ashok Leyland','Viking','52 Seater',2018,2018,210000,'diesel','manual','second','average',1850000,'Coimbatore, Tamil Nadu','52 seater staff bus, AC unit serviced, permit transferable.','active','verified'),
 ('11111111-1111-4111-8111-111111111107', NULL, 'commercial','Tata Motors','Ace Gold','Diesel Plus',2022,2022,41000,'diesel','manual','first','good',445000,'Surat, Gujarat','Ideal last-mile delivery mini truck, single owner.','active','verified'),
 ('11111111-1111-4111-8111-111111111108', NULL, 'car','Toyota','Fortuner','4x2 AT Legender',2021,2021,54000,'diesel','automatic','first','excellent',4250000,'Delhi NCR','Legender edition, full Toyota service history, immaculate interiors.','active','verified'),
 ('11111111-1111-4111-8111-111111111109', NULL, 'bike','Honda','Activa 6G','DLX',2023,2023,6100,'petrol','automatic','first','excellent',72000,'Kolkata, West Bengal','City scooter in mint condition, insurance valid till next year.','active','verified'),
 ('11111111-1111-4111-8111-111111111110', NULL, 'other','Force Motors','Traveller','26 Seater',2020,2020,98000,'diesel','manual','second','good',1290000,'Indore, Madhya Pradesh','School/tourist traveller with fresh paint and new seats.','active','verified');

INSERT INTO public.vehicle_images (vehicle_id, image_url, is_primary, sort_order) VALUES
 ('11111111-1111-4111-8111-111111111101','https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111101','https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',false,1),
 ('11111111-1111-4111-8111-111111111102','https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111102','https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80',false,1),
 ('11111111-1111-4111-8111-111111111103','https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111104','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111105','https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111106','https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111107','https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111108','https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111109','https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80',true,0),
 ('11111111-1111-4111-8111-111111111110','https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=1200&q=80',true,0);
