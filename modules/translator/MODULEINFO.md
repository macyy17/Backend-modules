# Translator Module

Translate text between any source and target language using Groq and `llama-3.3-70b-versatile`.

The module exposes one endpoint path with two accepted methods.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/translate` | Translate using query parameters. |
| POST | `/translate` | Translate using a JSON body. |

## Inputs

| Field | Required | Description |
| --- | --- | --- |
| `text` | Yes | Text to translate. |
| `from` | No | Source language. Use `auto` for detection. Defaults to `auto`. |
| `to` | Yes | Target language. Supports language names or codes. |

## GET `/translate`

Example:

```txt
/translate?text=Hello%20world&from=auto&to=Urdu
```

## POST `/translate`

Request:

```json
{
  "text": "Good morning",
  "from": "English",
  "to": "Spanish"
}
```

Response:

```json
{
  "translatedText": "Buenos días",
  "from": "English",
  "to": "Spanish"
}
```

## Environment

Required module env file:

```txt
modules/translator/.env
```

Required value:

```txt
GROQ_API_KEY=<your Groq key>
```

Optional value:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner
```

The module runner loads module env after selecting the module, so this file belongs with the module, not the generic server.

## Database

This module does not require database tables, migrations, or seeders.
