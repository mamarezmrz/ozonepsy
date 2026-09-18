ALTER TABLE "Specialist"
ADD COLUMN "aboutTitle" VARCHAR(240),
ADD COLUMN "aboutDescription" TEXT,
ADD COLUMN "specialtiesTitle" VARCHAR(240),
ADD COLUMN "specialtiesItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "educationTitle" VARCHAR(240),
ADD COLUMN "educationItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "responsibilitiesTitle" VARCHAR(240),
ADD COLUMN "responsibilitiesItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "booksTitle" VARCHAR(240),
ADD COLUMN "booksItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "quoteTitle" VARCHAR(240),
ADD COLUMN "quote" TEXT;
