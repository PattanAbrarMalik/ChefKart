FROM python:3.12-slim
LABEL description="ChefKart Flask Form Processing Service"

RUN adduser --system --group chefkart
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/instance && chown -R chefkart:chefkart /app

USER chefkart

ENV FLASK_ENV=production
ENV CHEFKART_FLASK_PORT=5001

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5001/')" || exit 1

CMD ["python", "app.py"]

