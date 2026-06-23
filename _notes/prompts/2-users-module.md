Pre-req: Study guide at `_notes/sequential/1-module-guide/README.md` and read `./docs/`

Current task:
- Create a module named `users`
- that has login page for login
- logout method
- and an internal method to check if user is logged in or not
- also use tables
- one role only (users) no admin.

completely create and test and let me know when done.

---

we do not need to show:

Check session Logout

```json
{
  "authenticated": true,
  "user": {
    "id": "79b42ede-d91b-4c6f-9cc1-9c4463faed58,
    "email": "user@example.com",
    "displayName": "Local User",
    "role": "user"
  }
}
```

as this ia a real login module. show login page only. and also make a /userstatus that is accessible after login only. if not lled in takes back to login page.
login page also accepts redirect url (default /) in query params. and make a nice ui using tailwind. it should taake "APP_NAME" from .env. and display as the login page of that app.

---

i cannot login, it always say invalid / in correct. (for users) either tell me user & pass or solve problem (if any)

---

update `_notes/sequential/1-module-guide/DETAILS.md` and `./docs/` as well so they are not left behind (if required)

---