# srsrp-reset-mailer (Cloudflare Worker)

Source of the worker behind both organisation e-mails:

- `POST /` — password reset: mints the real Firebase reset link and sends the green template.
- `POST /signup` — application receipt: mints the real e-mail verification link, rewrites it to
  the site's own `/verify-email?oobCode=…` page (so members never see Firebase's blue hosted
  page) and sends `public/brand/email/application-received.html`.
- `POST /doc`, `GET /doc/:key` — member document uploads in the `DOCS` KV namespace.

Deploy without losing secrets or the KV binding:

```
curl -X PUT \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -F 'metadata={"main_module":"worker.js","compatibility_date":"2024-09-23","keep_bindings":["kv_namespace","secret_text","plain_text"]};type=application/json' \
  -F "worker.js=@reset-mailer-worker.js;filename=worker.js;type=application/javascript+module" \
  https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts/srsrp-reset-mailer
```

The module part must be named `worker.js` to match `main_module`. Secrets (`FIREBASE_SA_JSON`,
`GMAIL_APP_PASSWORD`) and the `DOCS` KV namespace live only in the Worker settings.
