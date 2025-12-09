-- Seed data for Superteam Study Platform
-- Run this after creating the schema

-- Insert Instructors
INSERT INTO instructors (id, name, avatar, bio, specializations, socials) VALUES
(
  'instructor-1'::uuid,
  'Belac',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Belac',
  'Full-stack developer and Solana expert. Passionate about building decentralized applications and teaching the next generation of blockchain developers. Specializes in modern web development, smart contracts, and Solana ecosystem integration.',
  ARRAY['Fullstack Dev', 'Solana Mastery'],
  '{"twitter": "@belac", "github": "belac", "website": "https://belac.dev"}'::jsonb
),
(
  'instructor-2'::uuid,
  'Yves',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Yves',
  'Creative professional specializing in design and video editing. Expert in visual storytelling, UI/UX design, and post-production workflows. Loves bringing ideas to life through beautiful visuals and engaging content.',
  ARRAY['Design', 'Editing'],
  '{"twitter": "@yves", "website": "https://yves.design"}'::jsonb
),
(
  'instructor-3'::uuid,
  'FG',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=FG',
  'Versatile professional with expertise across multiple domains. Specializes in marketing strategy, UI/UX design, full-stack development, and creative design. Known for bridging the gap between technical and creative disciplines.',
  ARRAY['Marketing', 'UI/UX', 'Fullstack', 'Design'],
  '{"twitter": "@fg", "github": "fg", "website": "https://fg.dev", "linkedin": "fg"}'::jsonb
);

-- Note: Course, module, and lesson data should be inserted via the application
-- or through a migration script. This seed file only includes instructors.

