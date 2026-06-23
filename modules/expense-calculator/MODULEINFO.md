# Expense Calculator Module

A comprehensive expense tracking module that allows users to manage, track, and analyze their expenses.

## Features

- **Add Expenses**: Record expenses with name, amount, category, and date
- **Remove Expenses**: Delete expenses by ID
- **Calculate Totals**: Get the sum of all expenses
- **Category Analysis**: View expenses grouped by category with subtotals
- **List All Expenses**: Retrieve all tracked expenses

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/expenses` | Add a new expense |
| GET | `/expenses` | Get all expenses |
| DELETE | `/expenses` | Remove an expense by ID |
| GET | `/expenses/total` | Calculate total of all expenses |
| GET | `/expenses/by-category` | Get expenses grouped by category |

## Inputs

### Add Expense

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Name or description of the expense |
| `amount` | number | Yes | Amount spent (must be positive) |
| `category` | string | Yes | Category of the expense (e.g., Food, Transport, Utilities) |
| `date` | string | Yes | Date in ISO format (YYYY-MM-DD) |

## POST `/expenses`

Add a new expense using JSON body:

```json
{
  "name": "Grocery shopping",
  "amount": 45.50,
  "category": "Food",
  "date": "2024-06-15"
}
```

Response:

```json
{
  "success": true,
  "expense": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Grocery shopping",
    "amount": 45.50,
    "category": "Food",
    "date": "2024-06-15"
  }
}
```

## GET `/expenses`

Get all expenses:

```txt
/expenses
```

Response:

```json
{
  "expenses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Grocery shopping",
      "amount": 45.50,
      "category": "Food",
      "date": "2024-06-15"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Gas",
      "amount": 30.00,
      "category": "Transport",
      "date": "2024-06-14"
    }
  ],
  "count": 2
}
```

## DELETE `/expenses`

Remove an expense by ID:

```txt
/expenses?id=550e8400-e29b-41d4-a716-446655440000
```

Response:

```json
{
  "success": true,
  "message": "Expense with ID \"550e8400-e29b-41d4-a716-446655440000\" has been removed."
}
```

## GET `/expenses/total`

Calculate the total of all expenses:

```txt
/expenses/total
```

Response:

```json
{
  "total": 75.50,
  "currency": "USD"
}
```

## GET `/expenses/by-category`

Get expenses grouped by category:

```txt
/expenses/by-category
```

Response:

```json
{
  "Food": {
    "total": 45.50,
    "count": 1,
    "expenses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Grocery shopping",
        "amount": 45.50,
        "category": "Food",
        "date": "2024-06-15"
      }
    ]
  },
  "Transport": {
    "total": 30.00,
    "count": 1,
    "expenses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Gas",
        "amount": 30.00,
        "category": "Transport",
        "date": "2024-06-14"
      }
    ]
  }
}
```

## Error Response

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Expense amount must be a positive number.",
    "details": {
      "fields": ["name", "amount", "category", "date"]
    }
  }
}
```
