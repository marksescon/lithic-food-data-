import csv
import json
import os
import sys
import urllib.request

SHEET_CSV_URL = os.environ["SHEET_CSV_URL"]
OUTPUT_PATH = "docs/food.json"


def fetch_csv(url: str) -> str:
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8")


def parse_rows(csv_text: str) -> list[dict]:
    reader = csv.DictReader(csv_text.splitlines())
    items = []
    for row in reader:
        items.append({
            "food": row["food"].strip(),
            "servingSize": row["servingSize"].strip(),
            "totalCalories": float(row["totalCalories"]),
            "protein": float(row["protein"]),
            "fat": float(row["fat"]),
            "carbs": float(row["carbs"]),
        })
    return items


def main():
    csv_text = fetch_csv(SHEET_CSV_URL)
    items = parse_rows(csv_text)
    if not items:
        print("No rows parsed, aborting to avoid overwriting with empty data.")
        sys.exit(1)
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(items, f, indent=2)
    print(f"Wrote {len(items)} items to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()