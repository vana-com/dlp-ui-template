# ⚠️ Temporary Workarounds - REMOVE BEFORE PRODUCTION

## 🔍 Quick Search: "TODO-TEMP-REMOVE"

**To find all temporary code:** Search the codebase for `TODO-TEMP-REMOVE`

This document lists all temporary workarounds implemented for the Q4 demo that **MUST BE REMOVED** before production deployment.

---

## 🔴 CRITICAL: Backend Private Key for Dataset Pending List

### Location
- **API Route:** `app/api/dataset/add-pending-file/route.ts`
- **Hook:** `app/contribution/hooks/useContributionFlow.ts` (see `addFileToPendingList()`)
- **Environment Variable:** `DLP_OWNER_PRIVATE_KEY`

### The Problem

`DatasetRegistry.addPendingFile()` requires `FILE_MANAGER_ROLE`, which users don't have.

```solidity
function addPendingFile(uint256 datasetId, uint256 fileId) 
    external 
    onlyRole(FILE_MANAGER_ROLE)  // ❌ Users can't call this
```

### The Workaround (Demo Only)

Backend API route uses DLP owner's private key to call `addPendingFile()` on behalf of users:

```typescript
// Backend holds private key (UNSAFE for production)
const dlpOwnerAccount = privateKeyToAccount(process.env.DLP_OWNER_PRIVATE_KEY);

// Backend calls contract
await walletClient.writeContract({
  account: dlpOwnerAccount,
  functionName: 'addPendingFile',
  args: [datasetId, fileId]
});
```

### Why This Is Bad

1. **🔐 Centralized** - Backend holds DLP owner's private key
2. **💰 Expensive** - Backend pays gas for all contributions
3. **🎯 Single Point of Failure** - If backend compromised, DLP is compromised
4. **🚫 Not Trustless** - Users must trust backend

### Production Solution

**Smart Contract Upgrade Required**

Add a public contribution function to DatasetRegistry:

```solidity
function contributeToDataset(uint256 datasetId, uint256 fileId) external {
    // Verify caller owns the file (SPAM PROTECTION)
    IDataRegistry dataRegistry = IDataRegistry(dataRegistryAddress);
    require(
        dataRegistry.files(fileId).ownerAddress == msg.sender,
        "Can only contribute files you own"
    );
    
    // Verify dataset exists
    require(_datasets[datasetId].owner != address(0), "Dataset not found");
    
    // Check not already in dataset
    require(!_datasetFiles[datasetId][fileId], "File already in dataset");
    require(!_pendingFiles[datasetId][fileId], "File already pending");
    
    // Add to pending list
    _pendingFiles[datasetId][fileId] = true;
    _datasets[datasetId].pendingFileIds.push(fileId);
    
    emit FileAddedToDataset(datasetId, fileId, true);
}
```

### Removal Checklist

**Search for:** `TODO-TEMP-REMOVE` to find all locations

- [ ] Deploy upgraded DatasetRegistry contract with `contributeToDataset()` function
- [ ] Update UI to call contract directly:
  ```typescript
  // Replace backend call with direct contract call
  await datasetRegistry.write.contributeToDataset([datasetId, fileId]);
  ```
- [ ] Delete `app/api/dataset/` directory (entire directory)
- [ ] Remove `addFileToPendingList()` function from `useContributionFlow.ts`
- [ ] Remove the `addFileToPendingList()` call from `executeRuntimeTaskAndRewardSteps()`
- [ ] Remove `DLP_OWNER_PRIVATE_KEY` from `.env.example` and `.env.local`
- [ ] Remove file header warning from `useContributionFlow.ts`
- [ ] Verify no instances of `TODO-TEMP-REMOVE` remain

---

## 📊 Attack Vector Mitigation Notes

### Current Risk (With Workaround)

Backend could be exploited to spam `addPendingFile()` calls, but:
- ✅ Backend can add rate limiting
- ✅ Backend can validate user authentication
- ✅ Gas costs still limit spam
- ✅ Task rejection cleans up spam files

### Production Risk (With Contract Upgrade)

Users could spam `contributeToDataset()` calls, mitigated by:
- ✅ **File ownership check** - Can only contribute files you paid to create
- ✅ **Gas costs** - Each call costs ~50k-100k gas
- ✅ **Task rejection** - Bad files get rejected and removed
- 🔄 **Optional: Pending list size limit** - Cap at 10k-100k files
- 🔄 **Optional: Contribution fee** - Small fee to dataset treasury
- 🔄 **Optional: Rate limiting** - Cooldown between contributions

**Recommended for Production:** File ownership check + gas costs provide sufficient protection.

---

## 🎯 Timeline

- **Q4 Demo (Now):** Use workaround with backend private key
- **Post-Demo:** Audit and test contract upgrade
- **Production:** Deploy upgrade and remove all workarounds

---

## 📋 Related Documentation

- See `ENV_VARIABLES.md` for environment setup
- See `/Users/brenn/Vana/vana-runtime/DATA_ACCESS_V1_IMPLEMENTATION.md` for runtime integration
- See design spec: `/Users/brenn/Downloads/Data Access V1_ Solution Architecture (1).md`

---

**Last Updated:** 2025-11-13  
**Status:** 🟡 Workaround Active - Demo Only  
**Priority:** 🔴 High - Must remove before mainnet deployment

