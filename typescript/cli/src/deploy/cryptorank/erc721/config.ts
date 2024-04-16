import {
  ChainMap,
  ChainMetadata,
  GasRouterConfig,
  chainMetadata,
} from '@hyperlane-xyz/sdk';
import { Address, ChainId } from '@hyperlane-xyz/utils';

export type CrkMetadata = {
  type: string;
  chainId: ChainId;
  name: string;
  symbol: string;
  fees: number;
};
export type CryptorankERC721Config = GasRouterConfig & CrkMetadata;

export const globalCrk721Config = {
  type: 'erc721',
  gas: 200_000,
  owner: '0xBE135bcF2B6F05e2AD5a3a227E15222Bfd7c0B22',
  name: 'Cryptorank Hyperlane NFT',
  symbol: 'hCRK',
};

export const chainCrk721Configs: CryptorankChainConfig = {
  // bsctestnet: { ...chainMetadata.bsctestnet, fees: 1000 },
  // mumbai: { ...chainMetadata.mumbai, fees: 1000 },
  // polygon: {
  //   ...chainMetadata.polygon,
  //   foreignDeployment: '0xAddress',
  //   fees: 1000,
  // },
  polygon: { ...chainMetadata.polygon, fees: 0.44 * 1e18 },
  bsc: { ...chainMetadata.bsc, fees: 0.001184 * 1e18 },
  arbitrum: { ...chainMetadata.arbitrum, fees: 0.00016 * 1e18 },
  moonbeam: { ...chainMetadata.moonbeam, fees: 1.01976 * 1e18 },
  optimism: { ...chainMetadata.optimism, fees: 0.00016 * 1e18 },
  avalanche: { ...chainMetadata.avalanche, fees: 0.009744 * 1e18 },
  celo: { ...chainMetadata.celo, fees: 0.5328 * 1e18 },
  gnosis: { ...chainMetadata.gnosis, fees: 0.36 * 1e18 },
  base: { ...chainMetadata.base, fees: 0.00016 * 1e18 },
  scroll: { ...chainMetadata.scroll, fees: 0.00064 * 1e18 },
  inevm: { ...chainMetadata.inevm, fees: 0.008 * 1e18 },
  polygonzkevm: { ...chainMetadata.polygonzkevm, fees: 0.00016 * 1e18 },
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

export type CryptorankChainConfig = ChainMap<
  ChainMetadata & { fees: number; foreignDeployment?: Address }
>;
