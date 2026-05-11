FROM python:3.12-alpine

WORKDIR /app

RUN addgroup -S user && adduser -S -G user user

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY --chown=user:user . .

USER user

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]