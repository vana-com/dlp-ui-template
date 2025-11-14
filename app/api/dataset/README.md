# Dataset API Routes

## TODO-TEMP-REMOVE: DELETE THIS ENTIRE DIRECTORY BEFORE PRODUCTION

This directory contains **temporary API routes** for the Q4 demo that use backend private keys.

Search for "TODO-TEMP-REMOVE" across the codebase to find all related code.

---

## Current Routes

### POST `/api/dataset/add-pending-file`

**Purpose:** Add a file to dataset's pending list using backend private key

**Why it exists:** `DatasetRegistry.addPendingFile()` requires `FILE_MANAGER_ROLE` which users don't have

**Status:** 🟡 DEMO ONLY - Uses `DLP_OWNER_PRIVATE_KEY`

**Remove when:** Smart contracts upgraded with public `contributeToDataset()` function

---

## Production Migration Plan

See `TEMPORARY_WORKAROUNDS.md` in repository root for complete removal checklist.

**Summary:**
1. Upgrade DatasetRegistry contract with public contribute function
2. Update UI to call contract directly
3. Delete this entire `/api/dataset` directory
4. Remove `DLP_OWNER_PRIVATE_KEY` environment variable

---

**DO NOT DEPLOY TO PRODUCTION WITH THESE FILES**

