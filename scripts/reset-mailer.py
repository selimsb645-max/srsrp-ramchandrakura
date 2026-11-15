#!/usr/bin/env python3
"""
Password reset mailer (free, no paid services).

Flow
----
1. The website writes a request document to Firestore `resetRequests/{id}`
   with `status: "pending"` when the branded Base44 endpoint is unavailable.
2. This script (run by GitHub Actions every few minutes) picks up pending requests,
   creates the REAL Firebase password-reset link with the Admin service account
   (accounts:sendOobCode + returnOobLink), renders the green HTML template,
   and sends it through Gmail SMTP.

Secrets (GitHub repository secrets, never in the repo):
  FIREBASE_SA_JSON      full service-account JSON for the coop-save project
  GMAIL_APP_PASSWORD    16-character Google App Password for the sender account

Nothing is sent for unknown addresses, and one address can receive at most
3 reset mails per hour.
"""

from __future__ import annotations

import json
import os
import smtplib
import ssl
import sys
import time
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "coop-save-w1y1f8")
MAIL_FROM = os.environ.get("MAIL_FROM", "selimsb645@gmail.com")
MAIL_FROM_NAME = "শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ"
SUBJECT = "পাসওয়ার্ড রিসেট (শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ)"
SITE_URL = "https://selimsb645-max.github.io/srsrp-ramchandrakura/"
TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "public/brand/email/reset-password-email.html"
MAX_PER_RUN = 10
MAX_PER_EMAIL_PER_HOUR = 3
SCOPES = [
    "https://www.googleapis.com/auth/identitytoolkit",
    "https://www.googleapis.com/auth/cloud-platform",
]

FS_BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
IDP_BASE = f"https://identitytoolkit.googleapis.com/v1/projects/{PROJECT_ID}"


def credentials():
    raw = os.environ.get("FIREBASE_SA_JSON", "").strip()
    if not raw:
        sys.exit("FIREBASE_SA_JSON secret is missing")
    info = json.loads(raw)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    creds.refresh(Request())
    return creds, {"authorization": f"Bearer {creds.token}", "content-type": "application/json"}


def pending_requests(headers) -> list[dict]:
    query = {
        "structuredQuery": {
            "from": [{"collectionId": "resetRequests"}],
            "where": {
                "fieldFilter": {
                    "field": {"fieldPath": "status"},
                    "op": "EQUAL",
                    "value": {"stringValue": "pending"},
                }
            },
            "limit": MAX_PER_RUN,
        }
    }
    res = requests.post(f"{FS_BASE}:runQuery", headers=headers, data=json.dumps(query), timeout=30)
    res.raise_for_status()
    out = []
    for row in res.json():
        doc = row.get("document") or {}
        name = doc.get("name", "")
        fields = doc.get("fields", {})
        email = (fields.get("email", {}) or {}).get("stringValue", "").strip().lower()
        if name and email:
            out.append({"name": name, "id": name.rsplit("/", 1)[-1], "email": email})
    return out


def mark(headers, doc_name: str, fields: dict) -> None:
    mask = ",".join(fields)
    res = requests.patch(
        f"https://firestore.googleapis.com/v1/{doc_name}",
        headers=headers,
        params={"updateMask.fieldPaths": list(fields)},
        data=json.dumps({"fields": fields}),
        timeout=30,
    )
    if res.status_code >= 300:
        print(f"  ! could not update request: {res.status_code} {res.text[:160]}")


def recent_sends(headers, email: str) -> list[int]:
    res = requests.get(f"{FS_BASE}/resetThrottle/{email}", headers=headers, timeout=30)
    if res.status_code == 404:
        return []
    if res.status_code >= 300:
        return []
    hits = ((res.json().get("fields", {}) or {}).get("hits", {}) or {}).get("arrayValue", {}).get("values", [])
    stamps = []
    for item in hits:
        value = item.get("timestampValue") or item.get("integerValue")
        if value is None:
            continue
        if isinstance(value, str) and value.endswith("Z") and "-" in value:
            # ISO timestamp -> seconds
            import datetime

            stamps.append(int(datetime.datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()))
        else:
            stamps.append(int(value))
    cutoff = int(time.time()) - 3600
    return [s for s in stamps if s >= cutoff]


def remember_send(headers, email: str, stamps: list[int]) -> None:
    stamps = (stamps + [int(time.time())])[-5:]
    requests.patch(
        f"https://firestore.googleapis.com/v1/{FS_BASE}/resetThrottle/{email}",
        headers=headers,
        params={"updateMask.fieldPaths": "hits"},
        data=json.dumps(
            {
                "fields": {
                    "hits": {
                        "arrayValue": {
                            "values": [{"timestampValue": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(s))} for s in stamps]
                        }
                    }
                }
            }
        ),
        timeout=30,
    )


def display_name(headers, email: str) -> str:
    try:
        res = requests.post(f"{IDP_BASE}/accounts:lookup", headers=headers, data=json.dumps({"email": [email]}), timeout=30)
        users = res.json().get("users") or []
        name = (users[0].get("displayName") if users else "") or ""
        if name.strip():
            return name.strip()
    except Exception:  # noqa: BLE001 - greeting falls back to a neutral name
        pass
    return "সদস্য"


def reset_link(headers, email: str) -> str | None:
    res = requests.post(
        f"{IDP_BASE}/accounts:sendOobCode",
        headers=headers,
        data=json.dumps({"requestType": "PASSWORD_RESET", "email": email, "returnOobLink": True}),
        timeout=30,
    )
    if res.status_code >= 300:
        detail = res.text[:160]
        if "EMAIL_NOT_FOUND" in detail:
            return None
        raise RuntimeError(f"oobcode {res.status_code} {detail}")
    return res.json().get("oobLink")


def plain_text(name: str, link: str) -> str:
    return "\n".join(
        [
            f"প্রিয় {name},",
            "",
            "আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে আমরা পাসওয়ার্ড রিসেটের একটি অনুরোধ পেয়েছি।",
            "নিচের লিংকে গিয়ে আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড সেট করুন। লিংকটি একবার ব্যবহার করা যাবে এবং সীমিত সময়ের জন্য কার্যকর।",
            "",
            link,
            "",
            "লিংকটি কাজ না করলে উপরের ঠিকানাটি কপি করে ব্রাউজারে খুলুন।",
            "আপনি যদি এই অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন; আপনার বর্তমান পাসওয়ার্ড অপরিবর্তিত থাকবে।",
            "",
            "শুভেচ্ছান্তে,",
            MAIL_FROM_NAME,
            "৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা, নালিতাবাড়ী, শেরপুর",
            "",
            "এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে সরাসরি উত্তর দেবেন না।",
        ]
    )


def send_mail(email: str, name: str, link: str) -> None:
    password = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()
    if not password:
        sys.exit("GMAIL_APP_PASSWORD secret is missing")
    html = TEMPLATE_PATH.read_text(encoding="utf-8")
    html = html.replace("%LINK%", link).replace("%DISPLAY_NAME%", name).replace("%EMAIL%", email)

    msg = EmailMessage()
    msg["From"] = formataddr((MAIL_FROM_NAME, MAIL_FROM))
    msg["To"] = email
    msg["Reply-To"] = MAIL_FROM
    msg["Subject"] = SUBJECT
    msg.set_content(plain_text(name, link))
    msg.add_alternative(html, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=45) as server:
        server.login(MAIL_FROM, password)
        server.send_message(msg)


def main() -> int:
    creds, headers = credentials()
    requests_list = pending_requests(headers)
    if not requests_list:
        print("no pending reset requests")
        return 0

    print(f"{len(requests_list)} pending request(s)")
    sent = 0
    for item in requests_list:
        email, doc_name = item["email"], item["name"]
        print(f"- {email}")
        try:
            hits = recent_sends(headers, email)
            if len(hits) >= MAX_PER_EMAIL_PER_HOUR:
                mark(headers, doc_name, {"status": {"stringValue": "throttled"}})
                print("  throttled (3 in the last hour)")
                continue

            link = reset_link(headers, email)
            if not link:
                mark(headers, doc_name, {"status": {"stringValue": "no-account"}})
                print("  no such account")
                continue

            name = display_name(headers, email)
            send_mail(email, name, link)
            remember_send(headers, email, hits)
            mark(
                headers,
                doc_name,
                {
                    "status": {"stringValue": "sent"},
                    "sentAt": {"timestampValue": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
                    "provider": {"stringValue": "gmail-smtp"},
                },
            )
            sent += 1
            print("  sent")
        except Exception as error:  # noqa: BLE001 - one bad request must not stop the batch
            print(f"  failed: {error}")
            mark(
                headers,
                doc_name,
                {
                    "status": {"stringValue": "failed"},
                    "error": {"stringValue": str(error)[:300]},
                },
            )

    print(f"done: {sent} mail(s) sent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
