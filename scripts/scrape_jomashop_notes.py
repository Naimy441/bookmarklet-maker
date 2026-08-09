#!/usr/bin/env python3
"""Scrape Top/Heart/Base fragrance notes for each Jomashop purchase link.

Jomashop's "Product Details" block includes a "Fragrance notes" row
(`.more-detail-Row` whose `.more-detail-head` reads "Fragrance notes")
containing `.more-detail-content` items labelled "Top Notes", "Heart Notes"
and "Base Notes" (values are either a plain `.more-value` span or a list of
linked `.value-link` terms). This is present in the DOM for every product
tested (unlike the flashier `.gallery-item-fragrance` card, which only shows
up for some products), so it's used as the single source of truth here.
The site is a client-rendered React app, so this loads pages with headless
Chromium rather than a plain HTTP request.

Usage:
    python3 scripts/scrape_jomashop_notes.py
"""
import csv
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Clone Decants - price.csv"
OUT = ROOT / "Clone Decants - price_with_notes.csv"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
ROW_SELECTOR = ".more-detail-Row"
NAV_TIMEOUT_MS = 30000
SELECTOR_TIMEOUT_MS = 12000
MAX_RETRIES = 2

NOTE_COLUMNS = ["Top Notes", "Heart Notes", "Base Notes"]
NOTE_LABELS_NORM = {c.lower(): c for c in NOTE_COLUMNS}


def extract_value(content_el) -> str:
    # Multi-term note lists live inside a `.more-link` wrapper whose children
    # are a *mix* of `<a class="value-link">` (terms that link to a notes
    # collection) and plain `<span class="more-value">` (terms that don't),
    # in DOM order. Single-value fields (e.g. Scent) use a bare
    # `.more-value` with no `.more-link` wrapper at all.
    link_wrapper = content_el.query_selector(".more-link")
    if link_wrapper:
        terms = link_wrapper.query_selector_all(".value-link, .more-value")
        values = [t.inner_text().strip().rstrip(",").strip() for t in terms]
        return ", ".join(v for v in values if v)
    value_el = content_el.query_selector(".more-value")
    if value_el:
        return value_el.inner_text().strip()
    return ""


def extract_notes_from_page(page) -> dict:
    rows = page.query_selector_all(ROW_SELECTOR)
    for row in rows:
        head = row.query_selector(".more-detail-head")
        if not head or "fragrance notes" not in head.inner_text().strip().lower():
            continue
        notes = {}
        for content in row.query_selector_all(".more-detail-content"):
            label_el = content.query_selector(".more-label")
            if not label_el:
                continue
            label_norm = label_el.inner_text().strip().lower()
            if label_norm in NOTE_LABELS_NORM:
                notes[NOTE_LABELS_NORM[label_norm]] = extract_value(content)
        return notes
    return {}


def scrape_notes(page, url: str) -> dict:
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            page.goto(url, wait_until="load", timeout=NAV_TIMEOUT_MS)
            page.wait_for_selector(ROW_SELECTOR, state="attached", timeout=SELECTOR_TIMEOUT_MS)
            notes = extract_notes_from_page(page)
            if notes:
                return {col: notes.get(col, "N/A") for col in NOTE_COLUMNS}
            last_err = "fragrance notes row not found among .more-detail-Row elements"
        except PWTimeoutError as e:
            last_err = e
        except Exception as e:  # noqa: BLE001
            last_err = e
        time.sleep(1.5)
    print(f"  ! failed after {MAX_RETRIES} attempts: {url} ({last_err})", file=sys.stderr)
    return {col: "N/A" for col in NOTE_COLUMNS}


def main():
    with SRC.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames) + NOTE_COLUMNS
        rows = list(reader)

    for row in rows:
        for col in NOTE_COLUMNS:
            row[col] = ""

    total = len(rows)
    print(f"Scraping fragrance notes for {total} products...")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(user_agent=USER_AGENT)
        page = context.new_page()

        for i, row in enumerate(rows, start=1):
            url = row.get("Purchase Link", "").strip()
            if not url:
                for col in NOTE_COLUMNS:
                    row[col] = "N/A"
                continue
            notes = scrape_notes(page, url)
            row.update(notes)
            print(f"[{i}/{total}] {row.get('Product Name', '')!r} -> {notes}")

            if i % 10 == 0 or i == total:
                with OUT.open("w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(rows)

        browser.close()

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    failed = sum(1 for r in rows if all(r.get(c) == "N/A" for c in NOTE_COLUMNS))
    print(f"\nDone. Wrote {OUT}")
    print(f"Rows with no notes found: {failed}/{total}")


if __name__ == "__main__":
    main()
