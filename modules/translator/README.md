# Translator Module

The translator module exposes one endpoint path, `/translate`, with both `GET` and `POST` support.

It uses Groq chat completions with `llama-3.3-70b-versatile` and a required structured tool-call response.

## Environment

This module keeps its own environment file.

Copy:

```bash
cp modules/translator/.env.example modules/translator/.env
```

Then set:

```txt
GROQ_API_KEY=<your Groq key>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner
```

`GROQ_API_KEY` is required.

`DATABASE_URL` is optional for this translator module because it does not create tables, but it is supported by the module runner and is useful for modules that need PostgreSQL.

The module runner loads env files in this order:

```txt
root .env
server/.env
modules/translator/.env
shell runner overrides for MODULE, PORT, DATABASE_URL, POSTGRES_URL, MODULE_RUNNER_DATABASE_URL, PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE
```

That means module secrets should live in `modules/translator/.env`, while runner controls can still be overridden from the shell.

## Inputs

| Field | Required | Default | Description |
| --- | --- | --- | --- |
| `text` | Yes | none | Text to translate. |
| `from` | No | `auto` | Source language name/code, or `auto`. |
| `to` | Yes | none | Target language name/code. |

## GET

```txt
/translate?text=Hello%20world&from=auto&to=Urdu
```

## POST

```json
{
  "text": "Good morning",
  "from": "English",
  "to": "Spanish"
}
```

## Success Response

```json
{
  "translatedText": "Buenos días",
  "from": "English",
  "to": "Spanish"
}
```

## Error Response

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Text is required.",
    "details": {
      "fields": ["text", "from", "to"]
    }
  }
}
```

## Database

No database tables are required.

## Run

```bash
cd server
MODULE=translator PORT=3399 npm run dev
```

Then open:

```txt
http://localhost:3399/moduleinfo
http://localhost:3399/app
```
