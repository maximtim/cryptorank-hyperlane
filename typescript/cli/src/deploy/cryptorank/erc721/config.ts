import {
  ChainMap,
  ChainMetadata,
  GasRouterConfig,
  chainMetadata,
} from '@hyperlane-xyz/sdk';
import { ChainId } from '@hyperlane-xyz/utils';

export type CrkMetadata = {
  type: string;
  chainId: ChainId;
  name: string;
  symbol: string;
  fees: number;
};
export type CryptorankERC721Config = GasRouterConfig & CrkMetadata;

// SET DESIRED NETWORKS HERE
export const prodConfigs = {};

export const testCrk721Configs: CryptorankChainConfig = {
  // bsctestnet: { ...chainMetadata.bsctestnet, fees: 1000 },
  // mumbai: { ...chainMetadata.mumbai, fees: 1000 },
  polygon: { ...chainMetadata.polygon, fees: 1000 },
  bsc: { ...chainMetadata.bsc, fees: 1000 },
  // Chains.arbitrum,
  // Chains.ancient8,
  // Chains.avalanche,
  // Chains.bsc,
  // Chains.celo,
  // Chains.ethereum,
  // Chains.neutron,
  // Chains.mantapacific,
  // Chains.moonbeam,
  // Chains.optimism,
  // Chains.polygon,
  // Chains.gnosis,
  // Chains.base,
  // Chains.scroll,
  // Chains.polygonzkevm,
  // Chains.injective,
  // Chains.inevm,
  // Chains.viction,
};

export type CryptorankChainConfig = ChainMap<ChainMetadata & { fees: number }>;
