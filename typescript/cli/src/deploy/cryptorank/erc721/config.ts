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
  baseUri: string;
  fees: bigint;
};
export type CryptorankERC721Config = GasRouterConfig & CrkMetadata;

export const globalCrk721Config = {
  type: 'erc721',
  gas: 200_000,
  owner: '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  ownerOverride: '0xBE135bcF2B6F05e2AD5a3a227E15222Bfd7c0B22',
  name: 'Cryptorank Hyperlane NFT',
  symbol: 'hCRK',
  baseUri: 'https://api.cryptorank.io/dedicated/web3/hyperlane/nft/',
};

export const chainCrk721Configs: CryptorankChainConfig = {
  // bsctestnet: {
  //   ...chainMetadata.bsctestnet,
  //   foreignDeployment: '0xC21D7b86D8768499f28e9f67B2190DcAdb540A55',
  //   fees: 1000,
  // },
  // sepolia: { ...chainMetadata.sepolia, fees: 1000 },
  // polygon: {
  //   ...chainMetadata.polygon,
  //   foreignDeployment: '0xAddress',
  //   fees: 1000,
  // },
  polygon: { ...chainMetadata.polygon, fees: 440000000000000000n },
  bsc: { ...chainMetadata.bsc, fees: 1184000000000000n },
  arbitrum: { ...chainMetadata.arbitrum, fees: 160000000000000n },
  moonbeam: { ...chainMetadata.moonbeam, fees: 1019760000000000000n },
  optimism: { ...chainMetadata.optimism, fees: 160000000000000n },
  avalanche: { ...chainMetadata.avalanche, fees: 9744000000000000n },
  celo: { ...chainMetadata.celo, fees: 532800000000000060n },
  gnosis: { ...chainMetadata.gnosis, fees: 360000000000000000n },
  base: { ...chainMetadata.base, fees: 160000000000000n },
  scroll: { ...chainMetadata.scroll, fees: 640000000000000n },
  inevm: { ...chainMetadata.inevm, fees: 8000000000000000n },
  polygonzkevm: { ...chainMetadata.polygonzkevm, fees: 160000000000000n },
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
  ChainMetadata & { fees: bigint; foreignDeployment?: Address }
>;
