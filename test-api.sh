#!/usr/bin/env bash

# YAWT API Test Script
# This script demonstrates the REST API endpoints
# Note: You must be authenticated (have an active session) for these to work
# Optional: Install jq for pretty-printed JSON output (https://stedolan.github.io/jq/)

BASE_URL="http://localhost:8000"

echo "=== YAWT REST API Test ==="
echo ""
echo "Note: Start the server with 'deno task start' first"
echo "Then authenticate by visiting http://localhost:8000 and signing in with GitHub"
echo ""

# Check if jq is available
if command -v jq &> /dev/null; then
  JQ_CMD="jq"
else
  echo "Tip: Install jq for pretty-printed JSON output"
  JQ_CMD="cat"
  echo ""
fi

# Test /api/me endpoint
echo "1. Testing GET /api/me (Get current user)"
curl -s "${BASE_URL}/api/me" -c cookies.txt -b cookies.txt | $JQ_CMD
echo -e "\n"

# Test creating a note
echo "2. Testing POST /api/notes (Create a note)"
NOTE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Note", "content": "This is a test note created via API"}' \
  -b cookies.txt -c cookies.txt)
echo "$NOTE_RESPONSE" | $JQ_CMD

# Extract note ID
if command -v jq &> /dev/null; then
  NOTE_ID=$(echo "$NOTE_RESPONSE" | jq -r '.note.id // empty')
else
  # Fallback: extract ID using grep - works for simple cases
  NOTE_ID=$(echo "$NOTE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
fi

echo "Created note with ID: ${NOTE_ID}"
echo -e "\n"

# Test listing notes
echo "3. Testing GET /api/notes (List all notes)"
curl -s "${BASE_URL}/api/notes" -b cookies.txt -c cookies.txt | $JQ_CMD
echo -e "\n"

# Test getting a specific note
if [ ! -z "$NOTE_ID" ] && [ "$NOTE_ID" != "null" ]; then
  echo "4. Testing GET /api/notes/${NOTE_ID} (Get specific note)"
  curl -s "${BASE_URL}/api/notes/${NOTE_ID}" -b cookies.txt -c cookies.txt | $JQ_CMD
  echo -e "\n"

  # Test updating the note
  echo "5. Testing PUT /api/notes/${NOTE_ID} (Update note)"
  curl -s -X PUT "${BASE_URL}/api/notes/${NOTE_ID}" \
    -H "Content-Type: application/json" \
    -d '{"title": "Updated Test Note", "content": "This note has been updated"}' \
    -b cookies.txt -c cookies.txt | $JQ_CMD
  echo -e "\n"

  # Test deleting the note
  echo "6. Testing DELETE /api/notes/${NOTE_ID} (Delete note)"
  curl -s -X DELETE "${BASE_URL}/api/notes/${NOTE_ID}" -b cookies.txt -c cookies.txt | $JQ_CMD
  echo -e "\n"
fi

# Cleanup
rm -f cookies.txt

echo "=== Test Complete ==="
