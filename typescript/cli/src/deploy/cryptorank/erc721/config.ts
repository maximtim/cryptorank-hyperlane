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
  // bsctestnet: chainMetadata.bsctestnet,
  // mumbai: chainMetadata.mumbai,
  polygon: { ...chainMetadata.polygon, fees: 1000 },
  bsc: { ...chainMetadata.bsc, fees: 1000 },
};

export type CryptorankChainConfig = ChainMap<ChainMetadata & { fees: number }>;
