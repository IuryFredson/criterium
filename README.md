# criterium

An ATS debugger for developers: compare your resume against a job description before applying.

## Status

Early backend-only MVP.

## API

### `POST /analyze`

Compares resume text against a job description and returns deterministic ATS-style checks.

```json
{
  "resumeText": "Your resume text...",
  "jobText": "The job description...",
  "targetRole": "Backend Developer"
}
```

Example response:

```json
{
  "overallScore": 72,
  "targetRole": "Backend Developer",
  "foundKeywords": ["Node.js", "TypeScript"],
  "missingKeywords": ["PostgreSQL"],
  "checks": [
    {
      "level": "warn",
      "code": "MISSING_KEYWORD",
      "message": "The job mentions PostgreSQL, but the resume does not."
    }
  ]
}
```

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

The API starts on `http://127.0.0.1:3333` by default.

```bash
npm run check
npm test
npm run build
```
