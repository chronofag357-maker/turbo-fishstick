"""Mint 5-minute synthetic probes for an isolated room, never real account IDs."""
import base64
import hashlib
import hmac
import json
from pathlib import Path
import secrets
import time

values = dict(line.split("=", 1) for line in Path("/etc/p2p-livekit.env").read_text().splitlines() if "=" in line)
room = "probe-" + secrets.token_hex(12)
def encode(value):
    return base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b"=").decode()
tokens = []
for index in range(3):
    now = int(time.time())
    head = encode({"alg": "HS256", "typ": "JWT"})
    body = encode({"iss": values["LIVEKIT_API_KEY"], "sub": f"probe-{index}",
                   "name": f"Проверка {index+1}", "nbf": now-5, "exp": now+300,
                   "video": {"roomJoin": True, "room": room, "canPublish": True,
                             "canSubscribe": True, "canPublishData": True}})
    signed = head + "." + body
    signature = base64.urlsafe_b64encode(hmac.new(values["LIVEKIT_API_SECRET"].encode(), signed.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    tokens.append(signed + "." + signature)
print(json.dumps({"url": values["LIVEKIT_URL"], "tokens": tokens}))
