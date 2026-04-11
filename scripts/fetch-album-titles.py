#!/usr/bin/env python3
"""Fetch Google Photos album titles from URLs and write resolved albums JSON."""

import json
import re
import subprocess
import sys

ALBUMS_INPUT = "gopal-krishna-saxena/data/albums.json"
ALBUMS_OUTPUT = "gopal-krishna-saxena/data/albums-resolved.json"

def fetch_title(url):
    try:
        result = subprocess.run(
            ["curl", "-sL", url],
            capture_output=True, text=True, timeout=15
        )
        match = re.search(r"<title>(.*?)- Google Photos</title>", result.stdout)
        if match:
            return match.group(1).strip()
    except Exception as e:
        print(f"  Warning: failed to fetch {url}: {e}", file=sys.stderr)
    return None

def main():
    with open(ALBUMS_INPUT) as f:
        urls = json.load(f)

    albums = []
    for url in urls:
        print(f"Fetching title for {url}...")
        title = fetch_title(url)
        if title:
            print(f"  -> {title}")
        else:
            print(f"  -> (could not fetch, using URL as fallback)")
            title = url
        albums.append({"title": title, "url": url})

    with open(ALBUMS_OUTPUT, "w") as f:
        json.dump(albums, f, ensure_ascii=False, indent=2)

    print(f"\nWrote {len(albums)} albums to {ALBUMS_OUTPUT}")

if __name__ == "__main__":
    main()
