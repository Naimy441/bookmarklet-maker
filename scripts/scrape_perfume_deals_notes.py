#!/usr/bin/env python3
"""Add Top/Heart/Base fragrance-note columns to perfume_deals.csv.

Only rows with a Jomashop "Deal Link" are scraped (section-header rows and
blank rows are passed through untouched). Reuses the note-extraction logic
from scrape_jomashop_notes.py.

Usage:
    python3 scripts/scrape_perfume_deals_notes.py
"""
import csv
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_jomashop_notes import (  # noqa: E402
    extract_notes_from_page,
    NOTE_COLUMNS,
    ROW_SELECTOR,
    USER_AGENT,
)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Fragrance Clones - perfume_deals.csv"
OUT = ROOT / "Fragrance Clones - perfume_deals_with_notes.csv"

LINK_COLUMN = "Deal Link"
NAV_TIMEOUT_MS = 30000
SELECTOR_TIMEOUT_MS = 12000
MAX_RETRIES = 2


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
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    if LINK_COLUMN not in header:
        raise SystemExit(f"Could not find a {LINK_COLUMN!r} column in {SRC}")
    link_idx = header.index(LINK_COLUMN)
    new_header = header + NOTE_COLUMNS

    def get(row, idx):
        return row[idx].strip() if idx < len(row) else ""

    scrape_targets = [
        i for i, row in enumerate(rows)
        if "jomashop.com" in get(row, link_idx)
    ]
    total = len(scrape_targets)
    print(f"{len(rows)} total rows, {total} with a Jomashop link to scrape...")

    out_rows = [row + [""] * len(NOTE_COLUMNS) for row in rows]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(user_agent=USER_AGENT)
        page = context.new_page()

        for n, i in enumerate(scrape_targets, start=1):
            url = get(rows[i], link_idx)
            notes = scrape_notes(page, url)
            name = get(rows[i], 1) if len(rows[i]) > 1 else ""
            for j, col in enumerate(NOTE_COLUMNS):
                out_rows[i][len(header) + j] = notes[col]
            print(f"[{n}/{total}] {name!r} -> {notes}")

            if n % 10 == 0 or n == total:
                with OUT.open("w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(new_header)
                    writer.writerows(out_rows)

        browser.close()

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(new_header)
        writer.writerows(out_rows)

    failed = sum(
        1 for i in scrape_targets
        if all(out_rows[i][len(header) + j] == "N/A" for j in range(len(NOTE_COLUMNS)))
    )
    print(f"\nDone. Wrote {OUT}")
    print(f"Rows with no notes found: {failed}/{total}")


if __name__ == "__main__":
    main()
