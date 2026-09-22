import categoryData from "../shared/counseling-categories.json";

export type CounselingCategory = {
  slug: string;
  label: string;
  description: string;
  concernExamples: string[];
  recommendedServices: string[];
  detail: string;
};

// Category research: docs/counseling-categories-research.md. Shared with API validation.
export const counselingCategories: CounselingCategory[] = categoryData;
