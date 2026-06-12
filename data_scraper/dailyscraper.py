# import required library and required constants
import time
from io import StringIO
import requests
import pandas as pd
from pathlib import Path
from bs4 import BeautifulSoup

dailyPriceUrl = "https://www.sharesansar.com/today-share-price"

def getStatus(open, close):
    if close > open:
        return 1
    if open > close:
        return -1
    return 0


html = requests.get(dailyPriceUrl).text
bs = BeautifulSoup(html, "lxml")

# today's date in yyyy-mm-dd format
today = bs.find("span", {"class": "text-org"}).text

# get html tables
tables = pd.read_html(StringIO(html))

# select the first table i.e. the stock price table
dataTable = tables[0]

fileDir = Path("../data/")
for file in fileDir.glob("*.csv"):
    # first check if data already exist for this date
    existingDf = pd.read_csv(file)
    print(f"Reading {file}")
    lastRow = existingDf.iloc[-1]
    lastDate = lastRow["published_date"]
    if str(lastDate) != str(today):
        print(f"Updating {file} for {today}")
        symbol = file.stem
        data = dataTable.loc[dataTable["Symbol"] == symbol]
        if len(data) == 1:
            data = data.iloc[0]
            status = getStatus(float(data["Open"]), float(data["Close"]))
            dataRow = [
                [
                    today,
                    float(data["Open"]),
                    float(data["High"]),
                    float(data["Low"]),
                    float(data["Close"]),
                    float(data["Diff %"]),
                    float(data["Vol"]),
                    float(data["Turnover"]),
                    status,
                ]
            ]
            dataframe = pd.DataFrame(dataRow)
            try:
                dataframe.to_csv(file, mode="a", header=False, index=False)
            except Exception as e:
                print(f"Error updating {file}: {e}")