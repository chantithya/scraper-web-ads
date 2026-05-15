# flask-server>utils>scrap.py

import os
import time
import requests
import pandas as pd

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException, StaleElementReferenceException
from selenium.webdriver.chrome.service import Service

from urllib.parse import quote, urlparse, parse_qs, urlencode, urlunparse

import shutil


def setup_folders():
    if not os.path.exists("images"):
        os.makedirs("images")

    if not os.path.exists("data"):
        os.makedirs("data")


# def setup_driver():
#     chrome_options = Options()
#     chrome_options.add_argument("--disable-dev-shm-usage")
#     chrome_options.add_argument("--no-sandbox")
#     chrome_options.add_argument("--disable-gpu")
#     chrome_options.add_argument("--start-maximized")

#     service = Service(ChromeDriverManager().install())
#     driver = webdriver.Chrome(service=service, options=chrome_options)

#     return driver

def setup_driver():

    chrome_options = Options()

    chrome_options.binary_location = os.environ.get("CHROME_BIN")

    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")

    service = Service(
        os.environ.get("CHROMEDRIVER_PATH")
    )

    driver = webdriver.Chrome(
        service=service,
        options=chrome_options
    )

    return driver


def clean_facebook_url(url):
    parsed = urlparse(url)
    query = parse_qs(parsed.query)

    # Keep only stable parameters
    allowed_keys = ["stp", "_nc_cat", "ccb", "_nc_sid", "_nc_ht"]

    clean_query = {k: query[k] for k in allowed_keys if k in query}

    new_query = urlencode(clean_query, doseq=True)

    return urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        "",
        new_query,
        ""
    ))


def run_scraper(country, ad_type, keyword):
    print("Country:", country)
    print("Ad Type:", ad_type)
    print("Keyword:", keyword)

    setup_folders()
    driver = setup_driver()

    try:
        keyword_list = [keyword] if keyword else ["default keyword"]
        print("Keywords list:", keyword_list)

        for kw in keyword_list:   # ✅ FIX: avoid overwriting keyword
            data = []
            seen_ids = set()

            encoded_keyword = quote(kw)

            # ✅ FIX: use dynamic params
            url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=VN&q={encoded_keyword}&search_type=keyword_unordered"

            print(f"🔍 Searching: {kw}")
            driver.get(url)

            time.sleep(10)

            # Scroll
            for _ in range(5):
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(5)

            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.XPATH, "//span[contains(text(),'Library ID')]"))
            )

            ads = driver.find_elements(
                By.XPATH,
                "//span[contains(text(),'Library ID')]/ancestor::div[@class='xh8yej3']"
            )

            for ad in ads:
                try:
                    library_text = ad.find_element(
                        By.XPATH, ".//span[contains(text(),'Library ID')]"
                    ).text

                    library_id = library_text.replace("Library ID:", "").strip()

                    if library_id in seen_ids:
                        continue
                    seen_ids.add(library_id)

                    # STATUS
                    try:
                        status = ad.find_element(
                            By.XPATH, ".//span[text()='Active' or text()='Inactive']"
                        ).text
                    except:
                        status = ""

                    # DATE
                    try:
                        date = ad.find_element(
                            By.XPATH, ".//span[contains(text(),'-')]"
                        ).text
                    except:
                        date = ""

                    # PAGE
                    page_link, page_name = "", ""
                    try:
                        link_el = ad.find_element(By.XPATH, ".//a[contains(@href,'facebook.com')]")
                        page_link = link_el.get_attribute("href")
                        page_name = link_el.text
                    except:
                        pass

                    # SPONSORED
                    sponsored = "No"
                    try:
                        ad.find_element(By.XPATH, ".//strong[text()='Sponsored']")
                        sponsored = "Yes"
                    except:
                        pass

                    # TEXT
                    try:
                        ad_text = ad.find_element(
                            By.XPATH,
                            ".//div[contains(@style,'white-space: pre-wrap')]"
                        ).text
                    except:
                        ad_text = ""

                    # MEDIA
                    media_url = ""
                    try:
                        video = ad.find_elements(By.XPATH, ".//video")
                        if video:
                            media_url = video[0].get_attribute("src")
                        else:
                            images = ad.find_elements(
                                By.XPATH,
                                ".//div[contains(@class,'x1ywc1zp')]//img"
                            )
                            for img in images:
                                src = img.get_attribute("src")
                                if src and "scontent" in src and "s60x60" not in src:
                                    # media_url = clean_facebook_url(src)
                                    media_url = src
                                    break
                    except:
                        pass

                    # SAVE IMAGE
                    folder_path = os.path.join("images", kw.replace(" ", "_"))
                    os.makedirs(folder_path, exist_ok=True)

                    if media_url:
                        try:
                            headers = {
                                "User-Agent": "Mozilla/5.0",
                                "Referer": "https://www.facebook.com/",
                                "Accept": "image/*"
                            }

                            response = requests.get(media_url, headers=headers, timeout=15)

                            if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
                                image_path = os.path.join(folder_path, f"{library_id}.jpg")
                                with open(image_path, "wb") as f:
                                    f.write(response.content)

                        except Exception as e:
                            print("Image download error:", e)

                    # SAVE DATA
                    data.append({
                        "keyword": kw,
                        "status": status,
                        "library_id": library_id,
                        "date": date,
                        "page_name": page_name,
                        "page_link": page_link,
                        "sponsored": sponsored,
                        "ad_text": ad_text,
                        "media_url": media_url
                    })

                    print(f"✅ {kw} | {library_id} | {page_name}")

                except Exception as e:
                    print("Error:", e)

            # SAVE CSV
            csv_path = f"data/ads_full_data_{kw.replace(' ', '_')}.csv"
            pd.DataFrame(data).to_csv(csv_path, index=False)

            print(f"✅ Saved {csv_path}")

        return "Scraping done!"

    except Exception as e:
        print("Error:", str(e))
        return "Scraping failed!"

    finally:
        driver.quit()