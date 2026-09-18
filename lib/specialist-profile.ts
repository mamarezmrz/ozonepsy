export type SpecialistProfileSection = {
  id: string;
  title: string;
  description: string;
};

export function parseSpecialistProfileSections(value: unknown): SpecialistProfileSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id : `specialist-section-${index + 1}`,
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : "",
    }))
    .filter((section) => section.title.trim() || section.description.trim());
}

export function legacySpecialistProfileSections(input: {
  aboutTitle?: string | null;
  aboutDescription?: string | null;
  specialty?: string | null;
  specialtiesTitle?: string | null;
  specialtiesItems?: string[];
  educationTitle?: string | null;
  educationItems?: string[];
  responsibilitiesTitle?: string | null;
  responsibilitiesItems?: string[];
  booksTitle?: string | null;
  booksItems?: string[];
  quoteTitle?: string | null;
  quote?: string | null;
}): SpecialistProfileSection[] {
  const sections: SpecialistProfileSection[] = [];
  const add = (id: string, title: string | null | undefined, description: string | null | undefined) => {
    if (title?.trim() || description?.trim()) sections.push({ id, title: title?.trim() || "", description: description?.trim() || "" });
  };
  add("about", input.aboutTitle, input.aboutDescription);
  add("specialties", input.specialtiesTitle, input.specialtiesItems?.filter(Boolean).join("\n") || input.specialty);
  add("education", input.educationTitle, input.educationItems?.filter(Boolean).join("\n"));
  add("responsibilities", input.responsibilitiesTitle, input.responsibilitiesItems?.filter(Boolean).join("\n"));
  add("books", input.booksTitle, input.booksItems?.filter(Boolean).join("\n"));
  add("quote", input.quoteTitle, input.quote);
  return sections;
}
