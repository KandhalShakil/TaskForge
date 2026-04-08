#!/bin/bash
set -o errexit

cd backend
python manage.py migrate
python manage.py collectstatic --no-input
