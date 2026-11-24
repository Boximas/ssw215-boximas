import os
import base64
import requests
from dotenv import load_dotenv
load_dotenv()
token = os.getenv("GITHUB_TOKEN")
headers = {"Authorization": f"Bearer {token}"} if token else {}
res = requests.get(
    "https://api.github.com/repos/pallets/flask/readme",
    headers=headers,
    timeout=8,
)
print("status:", res.status_code)
print("requests left this hour:", res.headers.get("X-RateLimit-Remaining"))
if res.status_code == 200:
    readme = base64.b64decode(res.json()["content"]).decode("utf-8")
    print(readme[:80])
else:
    print("GitHub refused. Check GITHUB_TOKEN in .env.")