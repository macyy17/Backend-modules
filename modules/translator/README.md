# Translator Module

The translator module exposes `/translate` with both `GET` and `POST` support.

It uses Groq chat completions with `llama-3.3-70b-versatile` and a structured function response.

## Environment

Required environment variable:

```txt
GROQ_API_KEY
```

Put the real value in root `.env` or `server/.env`.

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
{"text":"Good morning","from":"English","to":"Spanish"}
```

## Success Response

```json
{
  "translatedText": "Buenos dias",
  "from": "English",
  "to": "Spanish",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

## Database

No database tables are required.

## Run

```bash
cd server
MODULE=translator PORT=3399 npm run dev
```
