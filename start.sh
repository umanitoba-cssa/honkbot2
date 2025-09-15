#!/bin/sh

# PocketBase startup script with automatic admin creation
# This script creates an admin account if it doesn't exist

echo "🚀 Starting PocketBase with auto-admin setup..."

# Start PocketBase in the background
/pb/pocketbase serve --http=0.0.0.0:8080 --dir=/pb/pb_data &
PB_PID=$!

# Wait for PocketBase to be ready
echo "⏳ Waiting for PocketBase to start..."
sleep 5

# Check if admin account exists and create if needed
if [ -n "$POCKETBASE_ADMIN_EMAIL" ] && [ -n "$POCKETBASE_ADMIN_PASSWORD" ]; then
    echo "👤 Checking for admin account..."
    
    # Try to create superuser account (this will fail if it already exists, which is fine)
    /pb/pocketbase superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD" --dir=/pb/pb_data 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Admin account created/updated successfully!"
        echo "📧 Email: $POCKETBASE_ADMIN_EMAIL"
    else
        echo "ℹ️  Admin account creation failed or already exists"
    fi
else
    echo "⚠️  POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD not set, skipping admin creation"
fi

# Wait for the PocketBase process to finish
wait $PB_PID
