#!/usr/bin/env python3
"""Fetch Google Photos album titles and cover images, write resolved albums JSON."""

import json
import os
import re
import subprocess
import sys

ALBUMS_INPUT = "gopal-krishna-saxena/data/albums.json"
ALBUMS_OUTPUT = "gopal-krishna-saxena/data/albums-resolved.json"
COVERS_DIR = "gopal-krishna-saxena/media/album-covers"


def fetch_album_page(url):
    try:
        result = subprocess.run(
            ["curl", "-sL", url],
            capture_output=True, text=True, timeout=15
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
            timeout=15, check=True
        )
        return filepath
    except Exception as e:
        print(f"  Warning: failed to download cover: {e}", file=sys.stderr)
        return None


def slugify(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')


def main():
    with open(ALBUMS_INPUT) as f:
        urls = json.load(f)

    albums = []
    for url in urls:
        print(f"Fetching {url}...")
        html = fetch_album_page(url)

        title = extract_title(html)
        if title:
            print(f"  title: {title}")
        else:
            print(f"  title: (could not fetch, using URL as fallback)")
            title = url

        slug = slugify(title)
        cover_url = extract_cover_url(html)
        cover_path = None
        if cover_url:
            cover_path = download_cover(cover_url, slug)
            if cover_path:
                print(f"  cover: {cover_path}")

        album = {"title": title, "url": url}
        if cover_path:
            # Store path relative to the page's index.html
            album["cover"] = cover_path.replace("gopal-krishna-saxena/", "")
        albums.append(album)

    with open(ALBUMS_OUTPUT, "w") as f:
        json.dump(albums, f, ensure_ascii=False, indent=2)

    print(f"\nWrote {len(albums)} albums to {ALBUMS_OUTPUT}")


if __name__ == "__main__":
    main()
