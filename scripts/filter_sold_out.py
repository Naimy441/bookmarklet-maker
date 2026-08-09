#!/usr/bin/env python3
"""Remove perfumes that are sold out or missing a purchase link.

Reads "Clone Decants - decant_deals_sorted.csv" from the repo root and writes
a filtered copy alongside it, plus a report of everything that got removed.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Clone Decants - decant_deals_sorted.csv"
OUT = ROOT / "Clone Decants - decant_deals_filtered.csv"
REPORT = ROOT / "Clone Decants - decant_deals_removed.csv"


def main():
    with SRC.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    kept, removed = [], []
    for row in rows:
        sold_out = row.get("Sold Out", "").strip()
        purchase_link = row.get("Purchase Link", "").strip()
        if sold_out or not purchase_link:
            reason = []
            if sold_out:
                reason.append("sold out")
            if not purchase_link:
                reason.append("no purchase link")
            removed.append({**row, "Reason": ", ".join(reason)})
        else:
            kept.append(row)

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(kept)

    with REPORT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames + ["Reason"])
        writer.writeheader()
        writer.writerows(removed)

    print(f"Total rows: {len(rows)}")
    print(f"Kept: {len(kept)}")
    print(f"Removed: {len(removed)}")
    print(f"Filtered CSV written to: {OUT}")
    print(f"Removed-rows report written to: {REPORT}")


if __name__ == "__main__":
    main()
