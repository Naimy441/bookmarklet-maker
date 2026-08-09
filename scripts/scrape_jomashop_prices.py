#!/usr/bin/env python3
"""Scrape the current USD sale price for each Jomashop purchase link in the
decants CSV and write it out to a new column.

Jomashop renders its product pages client-side (React), so a plain HTTP
request returns no price. This uses headless Chromium via Playwright to load
each page and read the price out of `.now-price span`.

Usage:
    python3 scripts/scrape_jomashop_prices.py
"""
import csv
import re
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Clone Decants - decant_deals_filtered.csv"
OUT = ROOT / "Clone Decants - decant_deals_with_current_price.csv"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
PRICE_SELECTOR = ".now-price span"
NAV_TIMEOUT_MS = 30000
SELECTOR_TIMEOUT_MS = 12000
MAX_RETRIES = 2
NEW_COLUMN = "Current Price"


def scrape_price(page, url: str) -> str:
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            page.goto(url, wait_until="load", timeout=NAV_TIMEOUT_MS)
            el = page.wait_for_selector(PRICE_SELECTOR, timeout=SELECTOR_TIMEOUT_MS)
            text = el.inner_text().strip()
            match = re.search(r"\$[\d,]+\.\d{2}", text)
            if match:
                return match.group(0)
            return text or "N/A"
        except PWTimeoutError as e:
            last_err = e
            time.sleep(1.5)
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(1.5)
    print(f"  ! failed after {MAX_RETRIES} attempts: {url} ({last_err})", file=sys.stderr)
    return "N/A"


def main():
    with SRC.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames) + [NEW_COLUMN]
        rows = list(reader)

    for row in rows:
        row[NEW_COLUMN] = ""

    total = len(rows)
    print(f"Scraping {total} product pages...")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(user_agent=USER_AGENT)
        page = context.new_page()

        for i, row in enumerate(rows, start=1):
            url = row.get("Purchase Link", "").strip()
            if not url:
                row[NEW_COLUMN] = "N/A"
                continue
            price = scrape_price(page, url)
            row[NEW_COLUMN] = price
            print(f"[{i}/{total}] {row.get('Product Name', '')!r} -> {price}")

            # Write progress incrementally so a crash doesn't lose all work.
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

    failed = sum(1 for r in rows if r.get(NEW_COLUMN) == "N/A")
    print(f"\nDone. Wrote {OUT}")
    print(f"Failed/unavailable prices: {failed}/{total}")


if __name__ == "__main__":
    main()
