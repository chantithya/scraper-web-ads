FROM python:3.11

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:10000"]