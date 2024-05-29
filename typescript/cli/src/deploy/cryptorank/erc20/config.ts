import {
  ChainMap,
  ChainMetadata,
  GasRouterConfig,
  chainMetadata,
} from '@hyperlane-xyz/sdk';
import { Address } from '@hyperlane-xyz/utils';

export type Crk20Metadata = {
  type: string;
  initialSupply: bigint;
  name: string;
  symbol: string;
  decimals: number;
  fees: bigint;
};
export type CryptorankERC20Config = GasRouterConfig & Crk20Metadata;

export const globalCrk20Config = {
  type: 'erc20',
  gas: 200_000,
  owner: '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  ownerOverride: '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  initialSupply: 1000000000000000000n,
  decimals: 18,
  name: 'Cryptorank Hyperlane FT',
  symbol: 'hftCRK',
};

export const chainCrk20Configs: Cryptorank20ChainConfig = {
  // sepolia: { ...chainMetadata.sepolia, fees: 1000n },
  // bsctestnet: {
  //   ...chainMetadata.bsctestnet,
  //   // foreignDeployment: '0xC21D7b86D8768499f28e9f67B2190DcAdb540A55',
  //   fees: 1000n,
  // },
  // polygon: {
  //   ...chainMetadata.polygon,
  //   foreignDeployment: '0xAddress',
  //   fees: 1000,
  // },
  // polygon: { ...chainMetadata.polygon, fees: 4400n },
  bsc: { ...chainMetadata.bsc, fees: 1184n },
  // arbitrum: { ...chainMetadata.arbitrum, fees: 160000000000000n },
  inevm: { ...chainMetadata.inevm, fees: 8000n },
  // optimism: { ...chainMetadata.optimism, fees: 160000000000000n },
  // moonbeam: { ...chainMetadata.moonbeam, fees: 1019760000000000000n },
  // avalanche: { ...chainMetadata.avalanche, fees: 9744000000000000n },
  // celo: { ...chainMetadata.celo, fees: 532800000000000060n },
  // gnosis: { ...chainMetadata.gnosis, fees: 360000000000000000n },
  // base: { ...chainMetadata.base, fees: 160000000000000n },
  // scroll: { ...chainMetadata.scroll, fees: 640000000000000n },
  // blast: { ...chainMetadata.blast, fees: 160000000000000n },
  // mode: { ...chainMetadata.mode, fees: 160000000000000n },
  // mantapacific: { ...chainMetadata.mantapacific, fees: 160000000000000n },
  // polygonzkevm: { ...chainMetadata.polygonzkevm, fees: 160000000000000n },
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

export type Cryptorank20ChainConfig = ChainMap<
  ChainMetadata & { fees: bigint; foreignDeployment?: Address }
>;
