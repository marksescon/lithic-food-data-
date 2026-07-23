import csv
import json
import os
import sys
import urllib.error
import urllib.request

SHEET_CSV_URL = os.environ["SHEET_CSV_URL"].strip()
OUTPUT_PATH = "docs/food.json"
REQUEST_TIMEOUT = 30


def fetch_csv(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
            return response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} fetching sheet CSV. Response body:\n{body}", file=sys.stderr)
        raise


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