# Expense Calculator Module

A comprehensive expense tracking module that allows you to manage and analyze your expenses.

## Features

- **Add Expenses**: Record expenses with name, amount, category, and date
- **Remove Expenses**: Delete expenses by ID
- **List All Expenses**: View all tracked expenses sorted by date
- **Calculate Total**: Get the sum of all your expenses
- **Group by Category**: View expenses organized by category with subtotals

## Environment

This module can work with or without environment variables. It uses in-memory storage for the session.

To set up the environment file (optional):

```bash
cp modules/expense-calculator/.env.example modules/expense-calculator/.env
```

The module runner loads env files in this order:

```
root .env
server/.env
modules/expense-calculator/.env
shell runner overrides
```

## API Reference

### Add Expense

**Endpoint**: `POST /expenses`

**Description**: Add a new expense to the tracker.

**Request Body**:
```json
{
  "name": "Grocery shopping",
  "amount": 45.50,
  "category": "Food",
  "date": "2024-06-15"
}
```

**Success Response** (201):
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

### Get All Expenses

**Endpoint**: `GET /expenses`

**Description**: Retrieve a list of all tracked expenses, sorted by date (newest first).

**Success Response** (200):
```json
{
  "expenses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Grocery shopping",
      "amount": 45.50,
      "category": "Food",
      "date": "2024-06-15"
    }
  ],
  "count": 1
}
```

### Remove Expense

**Endpoint**: `DELETE /expenses?id=<expense-id>`

**Description**: Remove an expense from the tracker.

**Query Parameters**:
- `id` (required): The unique identifier of the expense to remove

**Success Response** (200):
```json
{
  "success": true,
  "message": "Expense with ID \"550e8400-e29b-41d4-a716-446655440000\" has been removed."
}
```

### Calculate Total

**Endpoint**: `GET /expenses/total`

**Description**: Get the sum of all expenses.

**Success Response** (200):
```json
{
  "total": 75.50,
  "currency": "USD"
}
```

### Get Expenses by Category

**Endpoint**: `GET /expenses/by-category`

**Description**: Get all expenses grouped by category with totals.

**Success Response** (200):
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

## Error Responses

Validation errors return status 422:
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

Not found errors return status 404:
```json
{
  "error": {
    "code": "REMOVE_EXPENSE_FAILED",
    "message": "Expense with ID \"invalid-id\" not found.",
    "details": {}
  }
}
```

## Required Fields

When adding an expense, all of these fields are required:

| Field | Type | Example |
| --- | --- | --- |
| `name` | string | "Grocery shopping" |
| `amount` | number | 45.50 |
| `category` | string | "Food" |
| `date` | string (ISO) | "2024-06-15" |

- **name**: Description of the expense (non-empty string)
- **amount**: Cost amount (positive number)
- **category**: Category/type of expense (non-empty string)
- **date**: Date in YYYY-MM-DD format

## Run

To run the expense calculator module:

```bash
cd server
MODULE=expense-calculator PORT=3399 npm run dev
```

Then you can access the API at `http://localhost:3399`

## Example Usage

### Add multiple expenses:

```bash
curl -X POST http://localhost:3399/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grocery shopping",
    "amount": 45.50,
    "category": "Food",
    "date": "2024-06-15"
  }'

curl -X POST http://localhost:3399/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gas",
    "amount": 30.00,
    "category": "Transport",
    "date": "2024-06-14"
  }'
```

### Get all expenses:

```bash
curl http://localhost:3399/expenses
```

### Get expenses by category:

```bash
curl http://localhost:3399/expenses/by-category
```

### Get total expenses:

```bash
curl http://localhost:3399/expenses/total
```

### Remove an expense:

```bash
curl -X DELETE 'http://localhost:3399/expenses?id=550e8400-e29b-41d4-a716-446655440000'
```

## Notes

- Expenses are stored in memory during the application session
- When the server restarts, all expenses are cleared
- All amounts are rounded to 2 decimal places
- Dates must be in ISO format (YYYY-MM-DD)
