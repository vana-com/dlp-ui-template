import { Address } from "viem";

const vanaContracts = [
  "DataRegistryProxy",
  "TeePoolProxy",
  "DataLiquidityPoolProxy",
] as const;
export type VanaContract = (typeof vanaContracts)[number];

const addresses: Record<number, Record<VanaContract, Address>> = {
  14800: {
    DataRegistryProxy: "0x20c30D0FE1A36Fe82ea079b65Ee43bFfba130e99",
    TeePoolProxy: "0xE8EC6BD73b23Ad40E6B9a6f4bD343FAc411bD99A",
    DataLiquidityPoolProxy:
      (process.env.NEXT_PUBLIC_DLP_CONTRACT_ADDRESS as Address) ||
      "0xA20A4DBF82EdF89b773Ac7807B289B2f63808FB0",
  },
  1480: {
    DataRegistryProxy: "0x20c30D0FE1A36Fe82ea079b65Ee43bFfba130e99",
    TeePoolProxy: "0xE8EC6BD73b23Ad40E6B9a6f4bD343FAc411bD99A",
    DataLiquidityPoolProxy:
      (process.env.NEXT_PUBLIC_DLP_CONTRACT_ADDRESS as Address) ||
      "0xA20A4DBF82EdF89b773Ac7807B289B2f63808FB0",
  },
};

export const getContractAddress = (chainId: number, contract: VanaContract) => {
  const contractAddress = addresses[chainId]?.[contract];
  if (!contractAddress) {
    throw new Error(
      `Contract address not found for ${contract} on chain ${chainId}`,
    );
  }
  return contractAddress;
};
