#!/usr/bin/env python3
"""
Keep the site's public counters up to date (free, no paid services).

Why this exists
---------------
The website cannot count members from the browser. The `users` rule is an OR of
three conditions and Firestore only lets an anonymous *list* through when the query
itself pins `published == true` AND `role == 'member'` — so a visitor can never see
"how many people registered", only how many approved members are published.

So a scheduled GitHub Actions job counts with the Admin service account (which
bypasses rules) and writes the totals to `settings/publicStats`. The settings
collection is readable by everyone, and the home page prefers those numbers.

What is written
---------------
settings/publicStats = {
  memberCount, approvedCount, pendingCount,   # users with role == 'member'
  activityCount, eventCount, noticeCount, galleryCount,  # published content
  updatedAt, updatedBy
}

Usage
-----
  FIREBASE_SA_JSON=<service account json> python3 scripts/public-stats.py
  # local check only, uses a signed-in super-admin ID token instead of the SA:
  FIREBASE_ID_TOKEN=<idToken> python3 scripts/public-stats.py --dry-run
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

PROJECT = os.environ.get("FIREBASE_PROJECT_ID", "coop-save-w1y1f8")
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
SCOPES = ["https://www.googleapis.com/auth/datastore"]


def access_token() -> str:
    token = os.environ.get("FIREBASE_ID_TOKEN")
    if token:
        return token
    raw = os.environ.get("FIREBASE_SA_JSON")
    if not raw:
        sys.exit("FIREBASE_SA_JSON (or FIREBASE_ID_TOKEN) is required")
    info = json.loads(raw)
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token


def call(path: str, token: str, payload: dict | None = None, method: str = "GET"):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read() or b"{}"
            return json.loads(body), None
    except urllib.error.HTTPError as exc:
        return None, f"{exc.code}: {exc.read().decode()[:200]}"


def count_documents(token: str, collection: str, published_only: bool = False) -> int:
    """Server-side count; a single equality filter uses the automatic index."""
    structured: dict = {"from": [{"collectionId": collection}]}
    if published_only:
        structured["where"] = {
            "fieldFilter": {
                "field": {"fieldPath": "published"},
                "op": "EQUAL",
                "value": {"booleanValue": True},
            }
        }
    payload = {
        "structuredAggregationQuery": {
            "structuredQuery": structured,
            "aggregations": [{"alias": "c", "count": {}}],
        }
    }
    result, error = call(":runAggregationQuery", token, payload, method="POST")
    if error:
        raise RuntimeError(f"count {collection}: {error}")
    return int(result[0]["result"]["aggregateFields"]["c"]["integerValue"])


def member_status_counts(token: str) -> dict[str, int]:
    """One filtered query, counted in the worker (no composite index needed)."""
    payload = {
        "structuredQuery": {
            "from": [{"collectionId": "users"}],
            "where": {
                "fieldFilter": {
                    "field": {"fieldPath": "role"},
                    "op": "EQUAL",
                    "value": {"stringValue": "member"},
                }
            },
            "select": {"fields": [{"fieldPath": "status"}]},
            "limit": 5000,
        }
    }
    rows, error = call(":runQuery", token, payload, method="POST")
    if error:
        raise RuntimeError(f"users: {error}")
    total = 0
    statuses: dict[str, int] = {}
    for row in rows:
        document = row.get("document")
        if not document:
            continue
        total += 1
        status = (document.get("fields", {}).get("status", {}) or {}).get("stringValue", "unknown")
        statuses[status] = statuses.get(status, 0) + 1
    return {"total": total, **statuses}


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    token = access_token()

    members = member_status_counts(token)
    stats = {
        "memberCount": members["total"],
        "approvedCount": members.get("active", 0),
        "pendingCount": members.get("pending", 0),
        "activityCount": count_documents(token, "activities", published_only=True),
        "eventCount": count_documents(token, "events", published_only=True),
        "noticeCount": count_documents(token, "notices", published_only=True),
        "galleryCount": count_documents(token, "gallery", published_only=True),
    }
    print("counted:", json.dumps(stats, ensure_ascii=False))

    if dry_run:
        print("dry run, nothing written")
        return

    from datetime import datetime, timezone

    fields = {key: {"integerValue": str(value)} for key, value in stats.items()}
    fields["updatedAt"] = {"stringValue": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    fields["updatedBy"] = {"stringValue": "public-stats-job"}
    mask = "&".join(f"updateMask.fieldPaths={name}" for name in fields)

    _, error = call(f"/settings/publicStats?{mask}", token, {"fields": fields}, method="PATCH")
    if error:
        sys.exit(f"write failed: {error}")
    print("settings/publicStats updated")


if __name__ == "__main__":
    main()
