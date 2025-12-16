-- Add optional embedded video URL to class modules
-- This allows admins to attach an embed video (e.g. YouTube iframe URL) per module

ALTER TABLE class_modules
ADD COLUMN IF NOT EXISTS embed_video_url TEXT;

COMMENT ON COLUMN class_modules.embed_video_url IS 'Optional embed video URL for this module (e.g., YouTube/Vimeo embed link).';


