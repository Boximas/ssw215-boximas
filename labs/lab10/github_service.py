import os
from urllib.parse import quote

import requests
from dotenv import load_dotenv


load_dotenv()


class RepositoryNotFoundError(Exception):
    pass


class GitHubServiceError(Exception):
    pass


def fetch_readme(owner: str, repo: str) -> str:
    url = (
        "https://api.github.com/repos/"
        f"{quote(owner, safe='')}/{quote(repo, safe='')}/readme"
    )
    headers = {"Accept": "application/vnd.github.raw+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.RequestException as error:
        raise GitHubServiceError("Could not reach GitHub") from error

    if response.status_code == 404:
        raise RepositoryNotFoundError("Repository or README not found")
    if not response.ok:
        raise GitHubServiceError("GitHub could not return the README")

    return response.text[:4000]
