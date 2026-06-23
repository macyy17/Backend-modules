Pre-req:
- study `_notes/sequential/1-module-guide/README.md`. we need to compelte `_notes/sequential/1-module-guide/DETAILS.md`
- but before completing details, it is time to create a module runner server (details at `_notes/sequential/2-module-runner-server/MODULE-RUNNER-SERVER.md`)

Current task:
- in chat, create me a plan for module server runner creation
- according to details.

let me know when ready.

---

Current task:
- Use EigenMCP and completely setup task
- if you find blockers (commands blocked for execution), use `problem` resource
- But if still failed, share a big bash in chat that i shall run myself in cli

let me know when its done. so that we can move next.

---

Correction:
- use typescript as our modules shall use typescript
- include postgress db details in module runner server, so that it uses those login details for accessing db (user, password and db name all in psql string)
- so that it is ready for use.

also for speeding things up:
- give me a big bash, that i paste in terminal
- it runs and overrides output in ~/out.txt for each time
- so that i can share with you and you can continue.

big bash loop

---

big bash loop doesn't means give me a loop. it means we shall work in loop (you give bash, i run, i give you output. and start from step 1). untill we achive remaining tasks (if any)

---

give again. it also has the `node_modules` in output. big ouput.

Also if the module server is ready. don't waste my time, we have next things to do as well.

---

{
  "database": "postgresql://postgres:****@localhost:5432/module_runner",
  "ok": false,
  "message": "connect ECONNREFUSED 127.0.0.1:5432"
}

give me commands to start db or set users. you can use `semicolon` password for user `stranger` for sudo access. give me big bash now.

---

Recap:
1. We made module server
2. We need to make details for writing a module
3. Then we need to create a simple module (translator)
4. And then test with module server (and fix bugs if any)

Let's follow the lead, 1-by-1

Current task:
- Read `_notes/sequential/1-module-guide/README.md`
- and wite me full contents for `_notes/sequential/1-module-guide/DETAILS.md`.

write in chat. so that i can updated there.

---

Next-up:
- now it is time to create translator
- speed things up. and create a fully working translator module
- also test with module server

pro tips:
- run commands in batching (use batch rule and chain rule from system information resource)
- if blocked, use round-robin rule and replace rules. try harder. fallback to big bash if failed (read problem resource)

end goal:
- our translator is ready with tested.

module:
- Create a module named `translator`
- that that gets requests at `/translate` (in get or post both are accepted)
- it uses groq api (api key from .env) and asks llm to translate that (use llama 3.3 70b versatile model as it supports tool call). with tool cal ass required
- and it returns the translation
- also supports any language (user can specify user language as auto or specified. as well as output language)

endpoints = 1 only
methods = 2 (GET and POST)
inputs = 3 fields for /translate (text, from and to)

approach:
- first stest groq (with function call) using api from .env
- then add endpoint
- the complete the module related standards

Use key:
`reacted` for groq call (translation)


---

Next-up: in `./docs/` write details about module server and how to create a module.

and make sure our module server is not hardcoded, it can pick any module.

quick check:
- can we use .env vars from module itself ? (other than db)
- and our module server can override them if want or use.
- so that we keep groq key in module's own .env
- and keep the db creds as well over there
- so that the module server remains generic.

make required changes and write docs/ after that (if / when successfull)

---

In our server, if i add a module and use it after clone on a new system, i do not haev a way for running npm run db:migrate or db:seed. checkout api-dev skill and add accordingly.

migrations folder keep track and does not re-migrates or re-seeds unless user specified --force.

dev now. and test with expense-calculator

---

update `_notes/sequential/1-module-guide/DETAILS.md` and `./docs/` as well so they are not left behind (if required)

---

also add `db:reset` and `db:migrate -- --refresh` that removes and recreates.


---

give me big bash to run from repo root (that saves stdout to ~/out.txt -- overridse) so that i can send you output back. we can follow this method and run many things in btch. so that even if eigenmcp is failing, we can speed thing sup.

---

Create a new module for testing, that has a todo lists management. with a ui as well (i.e., /todo returns a simple page).

so that i can test migraitons with it as well.

after making module, remember to delete tables so that i can try from server lately.

---
