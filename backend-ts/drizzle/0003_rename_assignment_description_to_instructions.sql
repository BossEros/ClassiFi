DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'description'
  ) THEN
    ALTER TABLE public.assignments
      RENAME COLUMN description TO instructions;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'description_image_url'
  ) THEN
    ALTER TABLE public.assignments
      RENAME COLUMN description_image_url TO instructions_image_url;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignments'
      AND column_name = 'description_image_alt'
  ) THEN
    ALTER TABLE public.assignments
      RENAME COLUMN description_image_alt TO instructions_image_alt;
  END IF;
END $$;
