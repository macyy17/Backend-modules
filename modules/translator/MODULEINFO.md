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
  "translatedText": "Buenos dias",
  "from": "English",
  "to": "Spanish",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

## Environment

Required:

```txt
GROQ_API_KEY=<your Groq API key>
```

The module runner reads this from root `.env` or `server/.env`.

## Database

This module does not require database tables, migrations, or seeders.
