According to guide at `_notes/sequential/1-module-guide/README.md`, modules are created
create me a server tool at `./server/` that has a script `npm run dev`, which allows user to use internactive terminal (arrows and enter) to select a module.
and it runs that module. so that user can perform testing by visiting /moduleinfo (that has contents from MODULEINFO.md for that module) and renders using a markdown renderer. and all other endpoitns are performed according to details.

User can alos use `/app` to send raw requests (as most module are backend only. so user may be visiting /moduleinfo and /app only for testing).

only for modules that support ui, thir endpoints are helpful

inteface of /app:
- for /app, you can create a http request sender similar to postman
- that has dropdown for method selection (GET, POST, etc.). and url input.
- as well sa inputs for headers, cookies, etc.
- But they will rarely be used. as user can open a dropdown (with serach) to select presets from moduleinfo.json. (make a custom search component that shows a modal with big custom options instead of single row. that has box for method (green for GET, etc), url, etc. as well). and user can click on that to open.
- and user can fill up missing fields in query params, body, etc. and send the requests for testing.
- each endpoint has its own desc as well (from moduleinfo.json) that is visible once selected.

---