#!/usr/bin/env bash
# Admin Dashboard Implementation Verification Script
# This script checks that all required changes have been implemented

echo "=== YAWT Admin Dashboard Implementation Verification ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((checks_passed++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((checks_failed++))
        return 1
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found in $1: $3"
        ((checks_passed++))
        return 0
    else
        echo -e "${RED}✗${NC} Not found in $1: $3"
        ((checks_failed++))
        return 1
    fi
}

echo "1. Checking new files..."
check_file "routes/admin/index.tsx"
check_file "islands/AdminDashboard.tsx"
check_file "docs/ADMIN_DASHBOARD.md"

echo ""
echo "2. Checking User interface blocked field..."
check_content "utils/session.ts" "blocked?: boolean" "blocked field in User interface"

echo ""
echo "3. Checking UserProfile blocked field..."
check_content "routes/auth/callback.ts" "blocked?: boolean" "blocked field in callback UserProfile"
check_content "routes/api/admin/users.ts" "blocked?: boolean" "blocked field in API UserProfile"

echo ""
echo "4. Checking first user admin assignment..."
check_content "routes/auth/callback.ts" "isFirstUser ? \"admin\" : \"free\"" "first user admin logic"

echo ""
echo "5. Checking blocked user check in requireUser..."
check_content "utils/http.ts" "if (user.blocked)" "blocked user check"

echo ""
echo "6. Checking PUT endpoint for blocking users..."
check_content "routes/api/admin/users.ts" "async PUT(req)" "PUT endpoint"

echo ""
echo "7. Checking UserMenu admin link..."
check_content "components/UserMenu.tsx" "Admin Dashboard" "admin dashboard link"
check_content "components/UserMenu.tsx" "getUserRole" "role check import"

echo ""
echo "8. Checking AdminDashboard island..."
check_content "islands/AdminDashboard.tsx" "toggleBlockUser" "block/unblock function"
check_content "islands/AdminDashboard.tsx" "updateUserRole" "role update function"

echo ""
echo "=== Summary ==="
echo -e "Checks passed: ${GREEN}${checks_passed}${NC}"
echo -e "Checks failed: ${RED}${checks_failed}${NC}"

if [ $checks_failed -eq 0 ]; then
    echo -e "\n${GREEN}All checks passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some checks failed. Please review.${NC}"
    exit 1
fi
