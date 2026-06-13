import html as html_lib
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed


def scrape_company(ticker: str) -> dict[str, str]:
    """Fetch company full name and sector from ShareSansar."""
    ticker = ticker.upper().strip()
    url_ticker = ticker.replace("_", "/")
    url = f"https://www.sharesansar.com/company/{url_ticker}"

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    page_html = urllib.request.urlopen(req, timeout=15).read().decode()

    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", page_html, re.DOTALL)
    sector = re.search(r'<div id="sector"[^>]*>(.*?)</div>', page_html, re.DOTALL)

    if not h1 or not sector:
        raise ValueError(f"Could not parse page for {ticker}")

    raw_name = re.sub(r"\s+", " ", h1.group(1)).strip()
    name = re.sub(r"\s*\([^)]*\)\s*$", "", raw_name).strip()
    name = html_lib.unescape(name)
    sector_name = html_lib.unescape(sector.group(1).strip())
    print("ticker:", ticker, "name:", name, "sector:", sector_name)
    return {"ticker": ticker, "name": name, "sector": sector_name}


def scrape_companies(
    tickers: list[str],
    max_workers: int = 5,
) -> dict[str, dict | Exception]:
    """
    Scrape multiple tickers concurrently.

    Returns a dict mapping each ticker to its result dict, or an Exception
    if that ticker failed.
    """
    results: dict[str, dict | Exception] = {}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_ticker = {
            executor.submit(scrape_company, ticker): ticker
            for ticker in tickers
        }

        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            try:
                results[ticker] = future.result()
            except Exception as e:
                results[ticker] = e

    return results


if __name__ == "__main__":
    symbols = ["NICA", "NABIL", "NICAD8283"]
    results = scrape_companies(symbols, max_workers=5)

    for ticker, result in results.items():
        if isinstance(result, Exception):
            print(f"{ticker}: ERROR — {result}")
        else:
            print(result)
