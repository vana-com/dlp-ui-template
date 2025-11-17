#!/bin/bash
# Start Thinker Task for UI Testing
# This script registers and starts the Thinker task via orchestrator
# so the UI can submit contributions to it.

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ORCHESTRATOR_URL="https://vana-runtime-orchestrator-9f7zuwvxe-opendatalabs.vercel.app"
RUNTIME_ADDRESS="0xa2e19584bc2a4a293841128bb5b309914f67b865"
API_BASE="$ORCHESTRATOR_URL/api/v1/runtime/$RUNTIME_ADDRESS"
TASK_ID=1000
DATASET_ID=1
DLP_ID=186

echo ""
echo "=========================================="
echo "  Starting Thinker Task for UI Testing"
echo "  DLP ID: $DLP_ID"
echo "=========================================="
echo ""

# ============================================================================
# Check if orchestrator and runtime are running
# ============================================================================
echo -e "${BLUE}[CHECK] Verifying orchestrator is running...${NC}"
if ! curl -s "$ORCHESTRATOR_URL" > /dev/null 2>&1; then
    echo -e "${RED}✗ Orchestrator is not running at $ORCHESTRATOR_URL${NC}"
    echo ""
    echo "Please start the orchestrator first:"
    echo "  cd ../vana-runtime-orchestrator"
    echo "  npm run dev"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Orchestrator is running${NC}"

echo -e "${BLUE}[CHECK] Verifying Vana Runtime is accessible...${NC}"
if ! curl -s "$API_BASE/health" > /dev/null; then
    echo -e "${RED}✗ Runtime not accessible at $API_BASE${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. Vana Runtime is running: cd ../vana-runtime && docker-compose -f docker-compose.dev.yml up -d"
    echo "  2. Runtime is seeded in orchestrator: cd ../vana-runtime-orchestrator && npx tsx scripts/seed-local-runtime.ts"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Vana Runtime is accessible via orchestrator${NC}"
echo ""

# ============================================================================
# STEP 1: Register Task in Mock Registry
# ============================================================================
echo -e "${BLUE}[STEP 1] Registering Thinker Task (DLP $DLP_ID)...${NC}"
echo "POST $API_BASE/v1/tasks/_mock/register"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/v1/tasks/_mock/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": $TASK_ID,
    \"image_url\": \"vanaorg/vana-task-demo:latest\",
    \"dataset_id\": $DATASET_ID,
    \"dlp_id\": $DLP_ID,
    \"approved\": true
  }")

# Try to parse as JSON, show raw response if it fails
if echo "$REGISTER_RESPONSE" | jq '.' > /dev/null 2>&1; then
    echo "$REGISTER_RESPONSE" | jq '.'
    echo ""
    
    # Check for errors
    if echo "$REGISTER_RESPONSE" | jq -e '.error' > /dev/null; then
        echo -e "${YELLOW}⚠ Registration may have failed (task might already be registered)${NC}"
    else
        echo -e "${GREEN}✓ Task registered in mock registry${NC}"
    fi
else
    echo -e "${RED}✗ Invalid JSON response from orchestrator:${NC}"
    echo "$REGISTER_RESPONSE"
    echo ""
    echo "This might be an HTML error page. Check orchestrator logs."
    exit 1
fi
echo ""

# ============================================================================
# STEP 2: Start the Task
# ============================================================================
echo -e "${BLUE}[STEP 2] Starting Thinker Task...${NC}"
echo "POST $API_BASE/v1/tasks/$TASK_ID?dataset_id=$DATASET_ID&dlp_id=$DLP_ID"
echo ""

START_RESPONSE=$(curl -s -X POST "$API_BASE/v1/tasks/$TASK_ID?dataset_id=$DATASET_ID&dlp_id=$DLP_ID")
echo "$START_RESPONSE" | jq '.'
echo ""

# Check for errors
if echo "$START_RESPONSE" | jq -e '.detail' > /dev/null; then
    ERROR_DETAIL=$(echo "$START_RESPONSE" | jq -r '.detail')
    
    # Check if task is already running
    if [[ "$ERROR_DETAIL" == *"already running"* ]]; then
        echo -e "${YELLOW}⚠ Task is already running${NC}"
        echo ""
    else
        echo -e "${RED}✗ Error starting task: $ERROR_DETAIL${NC}"
        echo ""
        exit 1
    fi
else
    RUN_ID=$(echo "$START_RESPONSE" | jq -r '.run_id')
    echo -e "${GREEN}✓ Task started with run_id: $RUN_ID${NC}"
    echo ""
fi

# ============================================================================
# STEP 3: Wait for Task to be Running
# ============================================================================
echo -e "${BLUE}[STEP 3] Waiting for task to start...${NC}"
echo ""

for i in {1..12}; do
    sleep 2
    STATUS_RESPONSE=$(curl -s "$API_BASE/v1/tasks/$TASK_ID")
    TASK_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    
    echo -n "  Attempt $i/12: status=$TASK_STATUS"
    
    if [ "$TASK_STATUS" == "running" ]; then
        echo -e " ${GREEN}✓${NC}"
        break
    elif [ "$TASK_STATUS" == "failed" ]; then
        echo -e " ${RED}✗${NC}"
        echo ""
        echo -e "${RED}Task failed to start${NC}"
        echo "$STATUS_RESPONSE" | jq '.'
        exit 1
    else
        echo " (waiting...)"
    fi
    
    if [ $i -eq 12 ]; then
        echo ""
        echo -e "${RED}✗ Timeout waiting for task to start${NC}"
        echo "Current status: $TASK_STATUS"
        exit 1
    fi
done

echo ""

# ============================================================================
# STEP 4: Verify Task is Ready
# ============================================================================
echo -e "${BLUE}[STEP 4] Verifying Task Status...${NC}"
echo "GET $API_BASE/v1/tasks/$TASK_ID"
echo ""

STATUS_RESPONSE=$(curl -s "$API_BASE/v1/tasks/$TASK_ID")
echo "$STATUS_RESPONSE" | jq '.'

TASK_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
CONTAINER_NAME=$(echo "$STATUS_RESPONSE" | jq -r '.container_name')
HAS_MANIFEST=$(echo "$STATUS_RESPONSE" | jq -r '.has_manifest')

echo ""

if [ "$TASK_STATUS" != "running" ]; then
    echo -e "${RED}✗ Task not running (status: $TASK_STATUS)${NC}"
    exit 1
fi

if [ "$HAS_MANIFEST" != "true" ]; then
    echo -e "${YELLOW}⚠ Task has no manifest${NC}"
fi

echo -e "${GREEN}✓ Task is running and ready!${NC}"
echo ""
echo "  Container: $CONTAINER_NAME"
echo "  Has Manifest: $HAS_MANIFEST"
echo ""

# ============================================================================
# STEP 5: Test Health Endpoint
# ============================================================================
echo -e "${BLUE}[STEP 5] Testing Task Health...${NC}"
echo "GET $API_BASE/v1/tasks/$TASK_ID/health"
echo ""

HEALTH_RESPONSE=$(curl -s "$API_BASE/v1/tasks/$TASK_ID/health")
echo "$HEALTH_RESPONSE" | jq '.'
echo ""

HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')
if [ "$HEALTH_STATUS" == "healthy" ]; then
    echo -e "${GREEN}✓ Task is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Task health status: $HEALTH_STATUS${NC}"
fi
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "=========================================="
echo "  Thinker Task Ready for UI Testing!"
echo "=========================================="
echo ""
echo -e "${GREEN}Task Details:${NC}"
echo "  Task ID: $TASK_ID"
echo "  DLP ID: $DLP_ID"
echo "  Dataset ID: $DATASET_ID"
echo "  Status: $TASK_STATUS"
echo "  Container: $CONTAINER_NAME"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start the UI: cd dlp-ui-template && yarn dev"
echo "  2. Open the contributor UI (ie. http://localhost:3000)"
echo "  3. Sign in with Google"
echo "  4. Connect your wallet"
echo "  5. Contribute a thought!"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  Check task status:  curl $API_BASE/v1/tasks/$TASK_ID"
echo "  View operations:    curl $API_BASE/v1/tasks/$TASK_ID/operations"
echo "  View task logs:     docker logs $CONTAINER_NAME"
echo "  Stop task:          curl -X DELETE $API_BASE/v1/tasks/$TASK_ID"
echo ""

