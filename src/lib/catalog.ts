import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Catalog,
  CatalogAssessmentRef,
  CatalogBook,
} from "@/types/catalog";
import type { Subject } from "@/types/report";

let cachedCatalog: Catalog | null = null;

function getCatalogPath(): string {
  return join(process.cwd(), "data", "catalog.json");
}

export function loadCatalog(): Catalog {
  if (process.env.NODE_ENV === "production" && cachedCatalog) {
    return cachedCatalog;
  }

  const raw = readFileSync(getCatalogPath(), "utf-8");
  const catalog = JSON.parse(raw) as Catalog;

  if (process.env.NODE_ENV === "production") {
    cachedCatalog = catalog;
  }

  return catalog;
}

export function getBooks(subject?: Subject): CatalogBook[] {
  const catalog = loadCatalog();
  if (!subject) return catalog.books;
  return catalog.books.filter((book) => book.subject === subject);
}

export function findAssessmentById(
  assessmentId: string
): CatalogAssessmentRef | null {
  const catalog = loadCatalog();

  for (const book of catalog.books) {
    const assessment = book.assessments.find((item) => item.id === assessmentId);
    if (assessment) {
      return { book, assessment };
    }
  }

  return null;
}

export function getCatalogForClient() {
  return loadCatalog();
}
