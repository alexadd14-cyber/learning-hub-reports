# Assessment Catalog

The report generator loads assessments from `data/catalog.json`. Add new books and chapters here without changing application code.

## Structure

```json
{
  "version": 1,
  "books": [
    {
      "id": "unique-book-id",
      "name": "Book display name",
      "subject": "english | maths | science",
      "assessments": [
        {
          "id": "unique-assessment-id",
          "chapter": "Chapter 1",
          "title": "English Assessment - Chapter 1",
          "questions": [
            { "skillArea": "Reading comprehension", "maxMarks": 1 }
          ]
        }
      ]
    }
  ]
}
```

## Adding a new book

1. Copy an existing book entry in `data/catalog.json`
2. Give it a unique `id` and update `name`, `subject`, and `assessments`
3. Each assessment needs a unique `id` and a `questions` array (any length)
4. Refresh the page — in development the catalog reloads automatically

## Extended fields (photo matching)

Assessments can include optional `detection`, `markingStyle`, and `objectivesSection` blocks for future photo upload features. See `public/theta-unit-1-catalog.json` for a full example.

## Question marking

- Each question defaults to 1 mark unless `maxMarks` is set
- **Correct** = full marks · **Partially correct** = half marks · **Incorrect** / **Not attempted** = 0

## Scaling further

For very large catalogs, split books into separate files under `data/books/` and update `src/lib/catalog.ts` to merge them — the data model already supports any number of books, chapters, and questions.
