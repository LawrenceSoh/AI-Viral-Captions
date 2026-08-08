"""YouTube upload (Data API v3) — publishes as a PRIVATE DRAFT.

This is the human-in-the-loop gate: nothing goes public automatically. The
pipeline uploads privately; a human reviews in YouTube Studio and hits publish.

Setup (one-time, done by the channel owner — see README):
  1. Google Cloud project -> enable "YouTube Data API v3"
  2. OAuth client (Desktop) -> download client_secret.json into this folder
  3. First run opens a browser consent screen and caches token.json

Requires: google-api-python-client google-auth-oauthlib google-auth-httplib2
(installed separately; not needed for offline rendering).
"""
from __future__ import annotations
import os
from pathlib import Path

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
HERE = Path(__file__).resolve().parent.parent


def _service():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    token = HERE / "token.json"
    secret = HERE / "client_secret.json"
    creds = None
    if token.exists():
        creds = Credentials.from_authorized_user_file(str(token), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not secret.exists():
                raise RuntimeError("client_secret.json missing — see README OAuth setup.")
            creds = InstalledAppFlow.from_client_secrets_file(str(secret), SCOPES).run_local_server(port=0)
        token.write_text(creds.to_json())
    return build("youtube", "v3", credentials=creds)


def upload_draft(video_path: str, title: str, description: str, tags: list[str],
                 thumbnail_path: str | None = None,
                 category_id: str = "27", made_for_kids: bool = False) -> str:
    """Upload privately (draft). Returns the video id."""
    from googleapiclient.http import MediaFileUpload

    yt = _service()
    body = {
        "snippet": {"title": title[:100], "description": description,
                    "tags": tags[:15], "categoryId": category_id},
        "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": made_for_kids},
    }
    req = yt.videos().insert(
        part="snippet,status", body=body,
        media_body=MediaFileUpload(video_path, chunksize=-1, resumable=True),
    )
    resp = None
    while resp is None:
        _status, resp = req.next_chunk()
    vid = resp["id"]
    if thumbnail_path and os.path.exists(thumbnail_path):
        yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(thumbnail_path)).execute()
    print(f"Uploaded as PRIVATE draft: https://studio.youtube.com/video/{vid}/edit")
    return vid
