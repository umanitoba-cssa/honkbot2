#!/bin/sh

/pb/pocketbase serve --http=0.0.0.0:8080 --dir=/pb/pb_data &
PB_PID=$!

sleep 5

# Wait for the PocketBase process to finish
wait $PB_PID