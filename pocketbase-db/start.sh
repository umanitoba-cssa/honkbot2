#!/bin/sh
set -e

create_superuser() {
    if [ -n "$POCKETBASE_ADMIN_EMAIL" ] && [ -n "$POCKETBASE_ADMIN_PASSWORD" ]; then
        /pb/pocketbase superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD" --dir=/pb/pb_data
    fi
}

create_superuser
exec /pb/pocketbase serve --http=0.0.0.0:8080 --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations --automigrate