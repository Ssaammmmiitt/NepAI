import argparse
import csv
import json
import re
import sys
import time
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup


STOCKWISE_COLUMNS = [
    "published_date",
    "open",
    "high",
    "low",
    "close",
    "per_change",
    "traded_quantity",
    "traded_amount",
    "status",
]

DATA_DIR = "../data"
STOCKWISE_DIR = "../data/companies"
METADATA_DIR = "../data/metadata"


def clean_numeric(value):
    """
    Return a CSV-friendly numeric string with commas and percent signs removed.
    Empty, missing, and placeholder values are returned as an empty string.
    """
    if value is None:
        return ""

    text = str(value).strip()
    if not text or text.lower() == "nan" or text == "-":
        return ""

    text = text.replace(",", "").replace("%", "").strip()
    try:
        Decimal(text)
    except InvalidOperation:
        return ""
    return text


def numeric_decimal(value):
    cleaned_value = clean_numeric(value)
    if cleaned_value == "":
        return None

    try:
        return Decimal(cleaned_value)
    except InvalidOperation:
        return None


def price_status(close, prev_close):
    close_value = numeric_decimal(close)
    prev_close_value = numeric_decimal(prev_close)

    if close_value is None or prev_close_value is None:
        return 0
    if close_value > prev_close_value:
        return 1
    if close_value < prev_close_value:
        return -1
    return 0


def sanitize_symbol(symbol):
    """
    Convert a NEPSE symbol to the stockwise filename convention.

    Examples:
    NICA82/83 -> NICA82_83
    " NICA 82/83 " -> NICA82_83
    """
    safe_symbol = re.sub(r"\s+", "", str(symbol or "").strip())
    safe_symbol = safe_symbol.replace("/", "_")
    safe_symbol = re.sub(r'[\\:*?"<>|]', "_", safe_symbol)
    safe_symbol = safe_symbol.rstrip(". ")
    return safe_symbol


def parse_date_string(date_text):
    date_text = str(date_text).strip()
    for date_format in ("%m/%d/%Y", "%m_%d_%Y", "%Y-%m-%d", "%Y_%m_%d"):
        try:
            return datetime.strptime(date_text, date_format).strftime("%Y-%m-%d")
        except ValueError:
            continue
    raise ValueError(
        f"Could not parse date '{date_text}'. Expected MM/DD/YYYY, MM_DD_YYYY, or YYYY-MM-DD."
    )


def published_date_from_filename(file_path):
    return parse_date_string(Path(file_path).stem)


def stockwise_row(row, published_date):
    return {
        "published_date": published_date,
        "open": clean_numeric(row.get("Open", "")),
        "high": clean_numeric(row.get("High", "")),
        "low": clean_numeric(row.get("Low", "")),
        "close": clean_numeric(row.get("Close", "")),
        "per_change": clean_numeric(row.get("Diff %", "")),
        "traded_quantity": clean_numeric(row.get("Vol", "")),
        "traded_amount": clean_numeric(row.get("Turnover", "")),
        "status": price_status(row.get("Close", ""), row.get("Prev. Close", "")),
    }


def existing_published_dates(stock_file):
    if not stock_file.exists():
        return set()

    with stock_file.open("r", newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        if "published_date" not in (reader.fieldnames or []):
            return set()
        return {
            row.get("published_date", "").strip()
            for row in reader
            if row.get("published_date", "").strip()
        }


def append_stockwise_rows(df, published_date, stockwise_dir="stockwise_data"):
    stockwise_path = Path(stockwise_dir)
    stockwise_path.mkdir(parents=True, exist_ok=True)

    added_count = 0
    skipped_count = 0
    new_file_count = 0
    new_symbols = []

    for _, row in df.iterrows():
        symbol = sanitize_symbol(row.get("Symbol", ""))
        if not symbol:
            skipped_count += 1
            continue

        stock_file = stockwise_path / f"{symbol}.csv"
        existing_dates = existing_published_dates(stock_file)

        if published_date in existing_dates:
            skipped_count += 1
            continue

        is_new_file = not stock_file.exists()
        with stock_file.open("a", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=STOCKWISE_COLUMNS)
            if is_new_file:
                writer.writeheader()
                new_file_count += 1
                new_symbols.append(symbol)
            writer.writerow(stockwise_row(row, published_date))
            added_count += 1

    return {
        "added": added_count,
        "skipped": skipped_count,
        "new_files": new_file_count,
        "new_symbols": new_symbols,
    }


def read_json_file(file_path, default_value):
    if not file_path.exists():
        return default_value

    with file_path.open("r", encoding="utf-8") as json_file:
        return json.load(json_file)


def write_json_file(file_path, data):
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open("w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=2, ensure_ascii=False)
        json_file.write("\n")


def next_sector_id(sector_mappings):
    if not sector_mappings:
        return 0
    return max(int(sector_id) for sector_id in sector_mappings) + 1


def sector_id_for_name(sector_name, sector_mappings):
    sector_name = normalize_sector_name(sector_name)
    for sector_id, mapped_name in sector_mappings.items():
        if mapped_name == sector_name:
            return int(sector_id)

    sector_id = next_sector_id(sector_mappings)
    sector_mappings[str(sector_id)] = sector_name
    return sector_id


def normalize_sector_name(sector_name):
    sector_aliases = {
        "Hotel & Tourism": "Hotel and Tourism",
        "Hotel &amp; Tourism": "Hotel and Tourism",
    }
    clean_sector_name = str(sector_name).strip()
    return sector_aliases.get(clean_sector_name, clean_sector_name)


def update_metadata_for_new_symbols(symbols, metadata_dir="metadata"):
    unique_symbols = []
    seen_symbols = set()
    for symbol in symbols:
        if symbol not in seen_symbols:
            unique_symbols.append(symbol)
            seen_symbols.add(symbol)

    if not unique_symbols:
        return {"added": 0, "skipped": 0, "failed": 0}

    from scrape_details import scrape_company

    metadata_path = Path(metadata_dir)
    name_data_path = metadata_path / "name_data.json"
    sector_mappings_path = metadata_path / "sector_mappings.json"

    name_data = read_json_file(name_data_path, {})
    sector_mappings = read_json_file(sector_mappings_path, {})

    added_count = 0
    skipped_count = 0
    failed_count = 0

    for symbol in unique_symbols:
        if symbol in name_data:
            skipped_count += 1
            continue

        scrape_symbol = symbol.replace("_", "/")
        try:
            details = scrape_company(scrape_symbol)
        except Exception as exc:
            failed_count += 1
            print(f"Metadata scrape failed for {symbol} ({scrape_symbol}): {exc}")
            continue

        sector_id = sector_id_for_name(details["sector"], sector_mappings)
        name_data[symbol] = {
            "name": details["name"],
            "sector": sector_id,
        }
        added_count += 1

    if added_count:
        write_json_file(sector_mappings_path, sector_mappings)
        write_json_file(name_data_path, name_data)

    return {"added": added_count, "skipped": skipped_count, "failed": failed_count}


def import_daily_csv(csv_path, stockwise_dir="stockwise_data"):
    csv_path = Path(csv_path)
    published_date = published_date_from_filename(csv_path)
    df = pd.read_csv(csv_path, dtype=str).fillna("")
    return append_stockwise_rows(df, published_date, stockwise_dir)


def iter_daily_csv_files(paths):
    for path_text in paths:
        path = Path(path_text)
        if path.is_dir():
            yield from sorted(path.glob("*.csv"), key=published_date_from_filename)
        else:
            yield path


def search(driver, date):
    """
    Search share price data by date.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    driver.get("https://www.sharesansar.com/today-share-price")
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.XPATH, "//input[@id='fromdate']"))
    )
    date_input = driver.find_element(By.XPATH, "//input[@id='fromdate']")
    time.sleep(2)
    search_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//input[@id='fromdate']"))
    )
    date_input.send_keys(date)
    search_btn.click()
    time.sleep(2)

    if driver.find_elements(
        By.XPATH,
        "//*[contains(text(), 'Could not find floorsheet matching the search criteria')]",
    ):
        print("No data found for the given search.")
        print("Script Aborted")
        driver.close()
        sys.exit(1)


def get_page_table(driver, table_class, max_retries=3):
    from selenium.common.exceptions import TimeoutException
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    for attempt in range(1, max_retries + 1):
        try:
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located(
                    (By.XPATH, "//div[@class='floatThead-wrapper']")
                )
            )
            break
        except TimeoutException:
            if attempt == max_retries:
                raise
            print(f"Table not found (attempt {attempt}/{max_retries}), retrying...")
            time.sleep(3)
            driver.refresh()
            time.sleep(2)

    soup = BeautifulSoup(driver.page_source, "lxml")
    table = soup.find("table", {"class": table_class})
    tab_data = [
        [cell.text.replace("\r", "").replace("\n", "") for cell in row.find_all(["th", "td"])]
        for row in table.find_all("tr")
    ]
    return pd.DataFrame(tab_data)


def scrape_data(driver, date):
    from selenium.common.exceptions import NoSuchElementException
    from selenium.webdriver.common.by import By

    search(driver, date=date)
    pages = []
    count = 0
    while True:
        count += 1
        print(f"Scraping page {count}")
        page_table_df = get_page_table(
            driver,
            table_class="table table-bordered table-striped table-hover dataTable compact no-footer",
        )
        pages.append(page_table_df)
        try:
            next_btn = driver.find_element(By.LINK_TEXT, "Next")
            driver.execute_script("arguments[0].click();", next_btn)
            time.sleep(2)
        except NoSuchElementException:
            break
    driver.close()
    return pd.concat(pages, ignore_index=True) if pages else pd.DataFrame()


def clean_df(df):
    new_df = df.drop_duplicates(keep="first")
    new_header = new_df.iloc[0]
    new_df = new_df[1:].copy()
    new_df.columns = new_header
    new_df.drop(["S.No"], axis=1, inplace=True)
    return new_df


def scrape_daily_share_price(date):
    import chromedriver_autoinstaller as chromedriver
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options

    chromedriver.install()

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.115 Safari/537.36"
    )
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(120)
    df = scrape_data(driver, date)
    return clean_df(df)


def save_daily_csv(df, published_date, data_dir="data"):
    data_path = Path(data_dir)
    data_path.mkdir(parents=True, exist_ok=True)
    file_name = datetime.strptime(published_date, "%Y-%m-%d").strftime("%m_%d_%Y.csv")
    output_path = data_path / file_name
    df.to_csv(output_path, index=False)
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Scrape ShareSansar daily prices and maintain stockwise CSV files."
    )
    parser.add_argument(
        "--date",
        default=datetime.today().strftime("%m/%d/%Y"),
        help="Date to scrape. Accepts MM/DD/YYYY or YYYY-MM-DD. Defaults to today.",
    )
    parser.add_argument(
        "--stockwise-dir",
        default=STOCKWISE_DIR,
        help="Directory containing per-stock CSV files.",
    )
    parser.add_argument(
        "--import-data",
        nargs="+",
        help="Import existing daily CSV file(s) or folder(s) instead of scraping.",
    )
    parser.add_argument(
        "--save-daily",
        action="store_true",
        help="Also save the scraped daily market CSV into the data folder.",
    )
    parser.add_argument(
        "--metadata-dir",
        default=METADATA_DIR,
        help="Directory containing name_data.json and sector_mappings.json.",
    )
    parser.add_argument(
        "--skip-metadata",
        action="store_true",
        help="Do not scrape or update metadata for newly-created stock files.",
    )
    args = parser.parse_args()

    if args.import_data:
        totals = {"added": 0, "skipped": 0, "new_files": 0}
        new_symbols = []
        for csv_file in iter_daily_csv_files(args.import_data):
            result = import_daily_csv(csv_file, args.stockwise_dir)
            for key in totals:
                totals[key] += result[key]
            new_symbols.extend(result["new_symbols"])
            print(
                f"{csv_file}: added={result['added']} skipped={result['skipped']} "
                f"new_files={result['new_files']}"
            )
        if not args.skip_metadata:
            metadata_result = update_metadata_for_new_symbols(new_symbols, args.metadata_dir)
            print(
                f"Metadata update: added={metadata_result['added']} "
                f"skipped={metadata_result['skipped']} failed={metadata_result['failed']}"
            )
        print(
            f"Done. added={totals['added']} skipped={totals['skipped']} "
            f"new_files={totals['new_files']}"
        )
        return

    scrape_date = parse_date_string(args.date)
    scrape_input_date = datetime.strptime(scrape_date, "%Y-%m-%d").strftime("%m/%d/%Y")
    final_df = scrape_daily_share_price(scrape_input_date)
    result = append_stockwise_rows(final_df, scrape_date, args.stockwise_dir)
    if not args.skip_metadata:
        metadata_result = update_metadata_for_new_symbols(
            result["new_symbols"],
            args.metadata_dir,
        )
        print(
            f"Metadata update: added={metadata_result['added']} "
            f"skipped={metadata_result['skipped']} failed={metadata_result['failed']}"
        )

    if args.save_daily:
        output_path = save_daily_csv(final_df, scrape_date)
        print(f"Saved daily CSV to {output_path}")

    print(
        f"Stockwise update complete for {scrape_date}. "
        f"added={result['added']} skipped={result['skipped']} new_files={result['new_files']}"
    )


if __name__ == "__main__":
    main()
