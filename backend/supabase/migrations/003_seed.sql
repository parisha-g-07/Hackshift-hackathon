-- SyncTies Migration 003: Canonical Seed Data for Domains, Help Types & Compatibility

-- 1. Insert Canonical Domains
INSERT INTO public.domains (id, slug, name, category) VALUES
  ('11111111-1111-1111-1111-111111111101', 'computer-science', 'Computer Science', 'Technology'),
  ('11111111-1111-1111-1111-111111111102', 'data-science', 'Data Science', 'Technology'),
  ('11111111-1111-1111-1111-111111111103', 'ai-ml', 'AI & Machine Learning', 'Technology'),
  ('11111111-1111-1111-1111-111111111104', 'web-development', 'Web Development', 'Technology'),
  ('11111111-1111-1111-1111-111111111105', 'cybersecurity', 'Cybersecurity', 'Technology'),
  ('11111111-1111-1111-1111-111111111106', 'product-management', 'Product Management', 'Business & Product'),
  ('11111111-1111-1111-1111-111111111107', 'finance', 'Finance & Investment', 'Business & Finance'),
  ('11111111-1111-1111-1111-111111111108', 'consulting', 'Consulting & Strategy', 'Business & Strategy'),
  ('11111111-1111-1111-1111-111111111109', 'design', 'UI/UX & Product Design', 'Design'),
  ('11111111-1111-1111-1111-111111111110', 'research', 'Academic & Industrial Research', 'Research'),
  ('11111111-1111-1111-1111-111111111111', 'entrepreneurship', 'Entrepreneurship & Startups', 'Business'),
  ('11111111-1111-1111-1111-111111111112', 'marketing', 'Growth & Marketing', 'Business'),
  ('11111111-1111-1111-1111-111111111113', 'healthcare', 'Healthcare & BioTech', 'Life Sciences'),
  ('11111111-1111-1111-1111-111111111114', 'other', 'Other Professional Domains', 'General')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;

-- 2. Insert Canonical Help Types
INSERT INTO public.help_types (id, slug, name, description) VALUES
  ('22222222-2222-2222-2222-222222222201', 'referral', 'Job or Internship Referral', 'Direct internal employee referral for an active opening'),
  ('22222222-2222-2222-2222-222222222202', 'mock-interview', 'Mock Interview & Feedback', 'Technical, behavioral, or product case interview simulation'),
  ('22222222-2222-2222-2222-222222222203', 'resume-review', 'Resume & CV Review', 'Constructive critique and line-by-line feedback on your resume'),
  ('22222222-2222-2222-2222-222222222204', 'career-guidance', 'Career & Field Guidance', 'Strategic advice on role transitions, career roadmap, and industry trends'),
  ('22222222-2222-2222-2222-222222222205', 'higher-ed-guidance', 'Higher Education Guidance', 'Advice on master degrees, PhD applications, GRE/GMAT, and universities'),
  ('22222222-2222-2222-2222-222222222206', 'portfolio-review', 'Portfolio & Code Review', 'Review of design portfolio, GitHub projects, or open-source PRs'),
  ('22222222-2222-2222-2222-222222222207', 'project-guidance', 'Capstone & Project Mentorship', 'Technical direction on university or side projects'),
  ('22222222-2222-2222-2222-222222222208', 'other', 'General Mentoring', 'Custom professional discussion')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. Populate Help Type Compatibility Matrix
-- Self-compatibility is always 100
INSERT INTO public.help_type_compatibility (requested_help_type_id, offered_help_type_id, score)
SELECT id, id, 100.0 FROM public.help_types
ON CONFLICT (requested_help_type_id, offered_help_type_id) DO UPDATE SET score = 100.0;

-- Configured cross-type affinities:
-- Mock Interview (2202) -> Career Guidance (2204): 70
-- Resume Review (2203) -> Career Guidance (2204): 70
-- Portfolio Review (2206) -> Resume Review (2203): 70
-- Project Guidance (2207) -> Career Guidance (2204): 70
-- Referral (2201) -> Mock Interview (2202): 40
-- Referral (2201) -> Resume Review (2203): 40
-- Higher Ed (2205) -> Career Guidance (2204): 70
INSERT INTO public.help_type_compatibility (requested_help_type_id, offered_help_type_id, score) VALUES
  ('22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222204', 70.0),
  ('22222222-2222-2222-2222-222222222203', '22222222-2222-2222-2222-222222222204', 70.0),
  ('22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222203', 70.0),
  ('22222222-2222-2222-2222-222222222207', '22222222-2222-2222-2222-222222222204', 70.0),
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222202', 40.0),
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222203', 40.0),
  ('22222222-2222-2222-2222-222222222205', '22222222-2222-2222-2222-222222222204', 70.0)
ON CONFLICT (requested_help_type_id, offered_help_type_id) DO UPDATE SET score = EXCLUDED.score;

-- 4. Seed Matching Config (Version 1 Default)
INSERT INTO public.matching_config (
  version_name,
  is_active,
  weight_domain,
  weight_help_type,
  weight_capacity,
  weight_recency,
  recency_half_life_days,
  description
) VALUES (
  'matching_weights_v1',
  true,
  0.40,
  0.30,
  0.20,
  0.10,
  14.0,
  'Initial pilot weighted scoring model: 40% Domain Jaccard, 30% Help Fit, 20% Capacity, 10% Recency'
) ON CONFLICT (version_name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  weight_domain = EXCLUDED.weight_domain,
  weight_help_type = EXCLUDED.weight_help_type,
  weight_capacity = EXCLUDED.weight_capacity,
  weight_recency = EXCLUDED.weight_recency,
  recency_half_life_days = EXCLUDED.recency_half_life_days;
