-- Convert roles.title from text to jsonb for multilingual titles
-- - If title looks like JSON (starts with { or [), try casting to jsonb
-- - Otherwise replicate the existing string to all supported languages

ALTER TABLE "roles"
  ALTER COLUMN "title" TYPE jsonb
  USING (
    CASE
      WHEN "title" IS NULL THEN NULL
      WHEN left(ltrim("title"), 1) IN ('{', '[') THEN ("title")::jsonb
      ELSE jsonb_build_object('en', "title", 'ru', "title", 'rs', "title")
    END
  );



