#!/usr/bin/env python3
"""Fetch Google Photos album titles and cover images, write resolved albums JSON."""

import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

ALBUMS_INPUT = "gopal-krishna-saxena/data/albums.json"
ALBUMS_OUTPUT = "build/gopal-krishna-saxena/data/albums-resolved.json"
COVERS_DIR = "build/gopal-krishna-saxena/media/album-covers"
CURL_TIMEOUT = 30


def fetch_album_page(url):
    try:
        result = subprocess.run(
            ["curl", "-sL", url],
            capture_output=True, text=True, timeout=CURL_TIMEOUT
        )
        return result.stdout
    except Exception as e:
        print(f"  Warning: failed to fetch {url}: {e}", file=sys.stderr)
        return ""


def extract_title(html):
    match = re.search(r"<title>(.*?)- Google Photos</title>", html)
    return match.group(1).strip() if match else None


def extract_cover_url(html):
    match = re.search(r'https://lh3\.googleusercontent\.com/pw/[^"]+', html)
    if match:
        # Replace size params with a square crop for thumbnail
        cover_url = re.sub(r'=w\d+-h\d+.*', '=w200-h200-c', match.group(0))
        return cover_url
    return None


def download_cover(cover_url, slug):
    os.makedirs(COVERS_DIR, exist_ok=True)
    filepath = os.path.join(COVERS_DIR, f"{slug}.jpg")
    try:
        subprocess.run(
            ["curl", "-sL", "-o", filepath, cover_url],
            timeout=CURL_TIMEOUT, check=True
        )
        return filepath
    except Exception as e:
        print(f"  Warning: failed to download cover: {e}", file=sys.stderr)
        return None


def slugify(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')


def process_album(url):
    """Fetch metadata and cover for a single album. Returns album dict."""
    html = fetch_album_page(url)

    title = extract_title(html)
    if title:
        print(f"  {url} -> {title}")
    else:
        print(f"  {url} -> (could not fetch, using URL as fallback)")
        title = url

    slug = slugify(title)
    cover_url = extract_cover_url(html)
    cover_path = None
    if cover_url:
        cover_path = download_cover(cover_url, slug)

    album = {"title": title, "url": url}
    if cover_path:
        album["cover"] = cover_path.replace("build/gopal-krishna-saxena/", "")
    return album


def main():
    with open(ALBUMS_INPUT) as f:
        urls = json.load(f)

    print(f"Fetching {len(urls)} albums in parallel:\n  " + "\n  ".join(urls) + "\n")

    # Preserve original order by mapping futures to indices
    albums = [None] * len(urls)
    with ThreadPoolExecutor(max_workers=8) as pool:
        future_to_idx = {pool.submit(process_album, url): i for i, url in enumerate(urls)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            albums[idx] = future.result()

    os.makedirs(os.path.dirname(ALBUMS_OUTPUT), exist_ok=True)
    with open(ALBUMS_OUTPUT, "w") as f:
        json.dump(albums, f, ensure_ascii=False, indent=2)

    print(f"\nWrote {len(albums)} albums to {ALBUMS_OUTPUT}")


if __name__ == "__main__":
    main()
