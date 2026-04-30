# flask-server>server.py
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS 
import pandas as pd
from utils.scrap import run_scraper
import os
import zipfile
import io
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone



app = Flask(__name__)
CORS(app)


DATA_FOLDER = "data"
# 🔹 Get all keywords (CSV files)
@app.route("/keywords")
def get_keywords():
    files = os.listdir(DATA_FOLDER)

    keywords = [
        f.replace("ads_full_data_", "").replace(".csv", "")
        for f in files if f.endswith(".csv")
    ]

    return jsonify(keywords)


# 🔹 Get data by keyword
@app.route("/data/<keyword>")
def get_data_by_keyword(keyword):
    file_path = os.path.join(DATA_FOLDER, f"ads_full_data_{keyword}.csv")

    if not os.path.exists(file_path):
        return jsonify([])

    df = pd.read_csv(file_path)
    return df.to_json(orient="records")

@app.route("/download/<keyword>")
def download_file(keyword):
    file_path = f"data/ads_full_data_{keyword}.csv"

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        file_path,
        as_attachment=True,
        download_name=f"{keyword}.csv",
        mimetype="text/csv"
    )
    

@app.route("/scrap", methods=["GET"])
def scrap():
    country = request.args.get("country")
    ad_type = request.args.get("type")
    keyword = request.args.get("keyword")

    result = run_scraper(country, ad_type, keyword)

    return jsonify({
        "country": country,
        "type": ad_type,
        "keyword": keyword,
        "result": result
    })


@app.route("/download-images/<keyword>")
def download_images(keyword):
    folder_path = os.path.join("images", keyword)

    if not os.path.exists(folder_path):
        return jsonify({"error": "Folder not found"}), 404

    # Create zip in memory
    memory_file = io.BytesIO()

    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)

                # keep relative path inside zip
                arcname = os.path.relpath(file_path, folder_path)
                zf.write(file_path, arcname)

    memory_file.seek(0)

    return send_file(
        memory_file,
        download_name=f"{keyword}_images.zip",
        as_attachment=True,
        mimetype="application/zip"
    )


# 🔁 Daily scraper function
is_running = False

def run_daily_scraper():
    global is_running

    if is_running:
        print("⚠️ Previous job still running, skipping...")
        return

    is_running = True

    try:
        print("⏰ Running scraper...")

        files = os.listdir(DATA_FOLDER)

        keywords = [
            f.replace("ads_full_data_", "").replace(".csv", "")
            for f in files if f.endswith(".csv")
        ]

        for kw in keywords:
            clean_kw = kw.replace("_", " ")
            print(f"🔍 Scraping keyword: {clean_kw}")
            run_scraper("VN", "all", clean_kw)

        print("✅ Done!")

    finally:
        is_running = False


scheduler = BackgroundScheduler(timezone=timezone("Asia/Phnom_Penh"))
scheduler.add_job(run_daily_scraper, 'cron', hour=12, minute=0)


if __name__ == "__main__":
    scheduler.start()
    app.run(debug=True)

# source venv/bin/activate