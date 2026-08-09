#!/usr/bin/env python3
"""Rank scents in a decants CSV by note-similarity to one or more target
fragrance profiles.

Each target profile is a dict of {"top": [...], "heart": [...], "base": [...]}.
Similarity per category is a Dice-coefficient over normalized note tokens
(exact match after normalization, or substring containment to catch variety
names like "Turkish rose" vs plain "Rose"), and the category scores are
averaged into one score per target. A scent's overall rank uses the best
(max) score across all provided target profiles.

Usage:
    python3 scripts/rank_by_notes.py
"""
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Clone Decants - notes.csv"
OUT = ROOT / "Clone Decants - notes_ranked.csv"

# Ingredient synonyms so e.g. "Oud" and "Agarwood (oud)" count as the same note.
SYNONYMS = {
    "agarwood (oud)": "oud",
    "agarwood": "oud",
    "agar wood": "oud",
    "oudh": "oud",
}

TARGETS = {
    "Fragrance World - After Effect": {
        "top": ["Bergamot", "Pink pepper"],
        "heart": ["Bulgarian rose", "Jasmine", "Turkish rose"],
        "base": ["Agarwood (oud)", "Amber", "Vanilla"],
    },
    "Zimaya - Night Shadow": {
        "top": ["Incense", "Raspberry", "Rose"],
        "heart": ["Birch", "Saffron"],
        "base": ["Benzoin", "Geranium", "Oud"],
    },
}


def normalize(note: str) -> str:
    n = note.strip().lower()
    n = re.sub(r"\s+", " ", n)
    return SYNONYMS.get(n, n)


def parse_notes(field: str) -> list:
    if not field:
        return []
    return [normalize(n) for n in field.split(",") if n.strip()]


def note_matches(a: str, b: str) -> bool:
    if a == b:
        return True
    # "rose" should match "bulgarian rose" / "turkish rose" etc.
    a_words, b_words = a.split(), b.split()
    shorter, longer = (a, b) if len(a_words) <= len(b_words) else (b, a)
    return shorter in longer.split() or longer.endswith(" " + shorter) or longer.startswith(shorter + " ")


def dice_score(row_notes: list, target_notes: list) -> float:
    if not row_notes or not target_notes:
        return 0.0
    target_pool = list(target_notes)
    matched = 0
    for rn in row_notes:
        for i, tn in enumerate(target_pool):
            if note_matches(rn, tn):
                matched += 1
                target_pool.pop(i)
                break
    return 2 * matched / (len(row_notes) + len(target_notes))


def score_against_target(row, target) -> float:
    scores = [
        dice_score(parse_notes(row["Top Notes"]), [normalize(n) for n in target["top"]]),
        dice_score(parse_notes(row["Heart Notes"]), [normalize(n) for n in target["heart"]]),
        dice_score(parse_notes(row["Base Notes"]), [normalize(n) for n in target["base"]]),
    ]
    return sum(scores) / len(scores)


def main():
    with SRC.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    target_names = list(TARGETS.keys())
    for row in rows:
        per_target = {name: score_against_target(row, t) for name, t in TARGETS.items()}
        row["_per_target"] = per_target
        row["Best Match Score"] = round(max(per_target.values()) * 100, 1)
        row["Best Match Target"] = max(per_target, key=per_target.get)
        for name in target_names:
            row[f"Score vs {name}"] = round(per_target[name] * 100, 1)

    rows.sort(key=lambda r: r["Best Match Score"], reverse=True)

    out_fields = (
        ["Rank", "Product Name", "Inspired By", "Top Notes", "Heart Notes", "Base Notes"]
        + [f"Score vs {name}" for name in target_names]
        + ["Best Match Score", "Best Match Target", "Purchase Link"]
    )
    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        for i, row in enumerate(rows, start=1):
            writer.writerow({
                "Rank": i,
                "Product Name": row["Product Name"],
                "Inspired By": row["Inspired By"],
                "Top Notes": row["Top Notes"],
                "Heart Notes": row["Heart Notes"],
                "Base Notes": row["Base Notes"],
                **{f"Score vs {name}": row[f"Score vs {name}"] for name in target_names},
                "Best Match Score": row["Best Match Score"],
                "Best Match Target": row["Best Match Target"],
                "Purchase Link": row["Purchase Link"],
            })

    print(f"Wrote ranked CSV to {OUT}")
    print("\nTop 20:")
    for i, row in enumerate(rows[:20], start=1):
        print(f"{i:>3}. {row['Product Name']:<45} {row['Best Match Score']:>5}%  (best vs {row['Best Match Target']})")


if __name__ == "__main__":
    main()
