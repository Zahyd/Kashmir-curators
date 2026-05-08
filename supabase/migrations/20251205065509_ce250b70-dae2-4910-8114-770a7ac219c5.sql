-- Create CMS content tables

-- Site content (hero, general settings)
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text,
  subtitle text,
  content jsonb DEFAULT '{}',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site content"
  ON public.site_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view site content"
  ON public.site_content FOR SELECT
  USING (true);

-- CMS Packages
CREATE TABLE public.cms_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text NOT NULL,
  duration text NOT NULL,
  price integer NOT NULL,
  original_price integer NOT NULL,
  description text,
  image_url text,
  highlights text[] DEFAULT '{}',
  itinerary jsonb DEFAULT '[]',
  inclusions text[] DEFAULT '{}',
  exclusions text[] DEFAULT '{}',
  rating numeric(2,1) DEFAULT 4.5,
  review_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage packages"
  ON public.cms_packages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active packages"
  ON public.cms_packages FOR SELECT
  USING (is_active = true);

-- CMS Hotels
CREATE TABLE public.cms_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  star_rating integer NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  price_per_night integer NOT NULL,
  description text,
  image_url text,
  amenities text[] DEFAULT '{}',
  room_types jsonb DEFAULT '[]',
  rating numeric(2,1) DEFAULT 4.5,
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage hotels"
  ON public.cms_hotels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active hotels"
  ON public.cms_hotels FOR SELECT
  USING (is_active = true);

-- CMS Cabs
CREATE TABLE public.cms_cabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vehicle_type text NOT NULL,
  capacity integer NOT NULL,
  price_per_km numeric(10,2) NOT NULL,
  base_fare integer NOT NULL DEFAULT 0,
  description text,
  image_url text,
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_cabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cabs"
  ON public.cms_cabs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active cabs"
  ON public.cms_cabs FOR SELECT
  USING (is_active = true);

-- CMS Testimonials
CREATE TABLE public.cms_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  avatar_url text,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  package_name text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage testimonials"
  ON public.cms_testimonials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active testimonials"
  ON public.cms_testimonials FOR SELECT
  USING (is_active = true);

-- CMS FAQs
CREATE TABLE public.cms_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage faqs"
  ON public.cms_faqs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active faqs"
  ON public.cms_faqs FOR SELECT
  USING (is_active = true);

-- Media Library
CREATE TABLE public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  alt_text text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage media"
  ON public.media_library FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view media"
  ON public.media_library FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_packages_updated_at BEFORE UPDATE ON public.cms_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_hotels_updated_at BEFORE UPDATE ON public.cms_hotels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_cabs_updated_at BEFORE UPDATE ON public.cms_cabs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_testimonials_updated_at BEFORE UPDATE ON public.cms_testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_faqs_updated_at BEFORE UPDATE ON public.cms_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies
CREATE POLICY "Admins can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');