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

### `POST /analyze-file`

Analyzes uploaded resume documents. The request must use `multipart/form-data`.

Fields:

- `resumeFile`: required `.txt`, `.pdf`, or `.docx` file.
- `jobText`: job description text. Required unless `jobFile` is provided.
- `jobFile`: optional `.txt`, `.pdf`, or `.docx` job description file.
- `targetRole`: optional target role text.

```bash
curl -X POST http://127.0.0.1:3333/analyze-file \
  -F "resumeFile=.pdf" \
  -F "jobText=Backend Developer with Node.js and PostgreSQL" \
  -F "targetRole=Backend Developer"
```

## CLI

```bash
npm run build
node dist/cli.js analyze --resume resume.pdf --job job.txt --target-role "Backend Developer" --format summary
```

During development:

```bash
npm run dev:cli -- analyze --resume resume.txt --job job.txt --format summary
```

Use `--format json` for machine-readable output. Exit code `2` means the report contains high-priority actions.

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
