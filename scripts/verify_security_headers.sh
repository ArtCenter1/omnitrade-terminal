#!/bin/bash

# Configuration
URL="http://localhost:8888/api"
EXPECTED_HEADERS=(
  "X-Frame-Options: DENY"
  "X-Content-Type-Options: nosniff"
  "X-XSS-Protection: 1; mode=block"
  "Referrer-Policy: strict-origin-when-cross-origin"
)

echo "Verifying security headers for $URL..."

# Fetch headers
HEADERS=$(curl -I -s "$URL")

# Check for expected headers
for header in "${EXPECTED_HEADERS[@]}"; do
  if echo "$HEADERS" | grep -q "$header"; then
    echo "✅ [FOUND] $header"
  else
    echo "❌ [MISSING] $header"
    exit 1
  fi
done

# Check for absence of X-Powered-By
if echo "$HEADERS" | grep -qi "X-Powered-By"; then
  echo "❌ [ERROR] X-Powered-By header is still present"
  exit 1
else
  echo "✅ [GONE] X-Powered-By"
fi

# Check for RateLimit headers (optional, but good to have)
if echo "$HEADERS" | grep -qi "RateLimit-Limit"; then
  echo "✅ [FOUND] RateLimit-Limit"
else
  echo "⚠️ [MISSING] RateLimit-Limit (Global rate limiter might not be active or responding as expected)"
fi

echo "All security header checks passed!"
exit 0
