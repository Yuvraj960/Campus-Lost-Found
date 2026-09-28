---
description: Read-only security audit of the whole app; produces a findings report, then fixes only what the user approves
---
1. Do NOT modify code in this step. Audit against `.agents/rules/30-security.md`, covering: authentication, authorization/IDOR, JWT handling, password hashing, Mongo queries and NoSQL injection, input validation, file uploads, CORS/headers, rate limiting, XSS, sensitive data exposure (especially reporter contact details and password fields), logging of secrets, dependency vulnerabilities (`npm audit`).
2. Write `docs/SECURITY_AUDIT.md`: a table of findings (ID, severity Critical/High/Medium/Low, file:line, description, exploit scenario, recommended fix).
3. Stop and ask which findings to fix. Then fix them one commit per finding (`fix(security): ...`) with a regression test where feasible, and update the report status.
