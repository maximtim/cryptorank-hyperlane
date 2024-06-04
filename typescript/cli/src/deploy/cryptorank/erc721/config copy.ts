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
  owner: '0x49989540E127A6953Cf0C4434F7a2b7c021846C7',
  ownerOverride: '0xBE135bcF2B6F05e2AD5a3a227E15222Bfd7c0B22',
  name: 'Cryptorank Hyperlane NFT',
  symbol: 'hCRK',
  baseUri: 'https://api.cryptorank.io/dedicated/web3/hyperlane/nft/',
};
// const chain = {
//   "polygon": '0xbcc23c02a3efec4a4c86c20f6b4cacd94e41b266',
//   "bsc": '0x8f581D91E36Be0bd683F8A8d884c946a5E74acE5',
//   "moonbeam": '0xbcC23c02A3EFEC4A4C86c20f6b4caCd94e41b266',
//   "avalanche": '0x6F1CDCb7dC0d2aC17b34994Db406FD5C115973E8',
//   "celo": '0x529C8B9685cC8db160fB7248189adaF46bD61DfD',
//   "gnosis": '0xBC70fa32dBc0a830eAb7570da1311fe934145Fc0',
//   "base": '0x80f1483f117C8Eb82748F707D4447fAD30086d30',
//   "scroll": '0xbcC23c02A3EFEC4A4C86c20f6b4caCd94e41b266',
//   "polygonzkevm": '0x529C8B9685cC8db160fB7248189adaF46bD61DfD',
//   "optimism": '0x1fCce39CCBE226bA69E277721D87516bEe236E33',
//   "arbitrum": '0x1fCce39CCBE226bA69E277721D87516bEe236E33',
// }
export const chainCrk721Configs: CryptorankChainConfig = {
  // polygon: {
  //   ...chainMetadata.polygon,
  //   fees: 440000000000000000n,
  //   foreignDeployment: '0xbcc23c02a3efec4a4c86c20f6b4cacd94e41b266',
  // },
  // bsc: {
  //   ...chainMetadata.bsc,
  //   fees: 1184000000000000n,
  //   foreignDeployment: '0x8f581D91E36Be0bd683F8A8d884c946a5E74acE5',
  // },
  // moonbeam: {
  //   ...chainMetadata.moonbeam,
  //   fees: 1000000000000000000n,
  //   foreignDeployment: '0xbcC23c02A3EFEC4A4C86c20f6b4caCd94e41b266',
  // },
  // avalanche: {
  //   ...chainMetadata.avalanche,
  //   fees: 9744000000000000n,
  //   foreignDeployment: '0x6F1CDCb7dC0d2aC17b34994Db406FD5C115973E8',
  // },

  // celo: {
  //   ...chainMetadata.celo,
  //   fees: 532800000000000000n,
  //   foreignDeployment: '0x529C8B9685cC8db160fB7248189adaF46bD61DfD',
  // },
  // gnosis: {
  //   ...chainMetadata.gnosis,
  //   fees: 360000000000000000n,
  //   foreignDeployment: '0xBC70fa32dBc0a830eAb7570da1311fe934145Fc0',
  // },

  // base: {
  //   ...chainMetadata.base,
  //   fees: 160000000000000n,
  //   foreignDeployment: '0x80f1483f117C8Eb82748F707D4447fAD30086d30',
  // },
  // scroll: {
  //   ...chainMetadata.scroll,
  //   fees: 640000000000000n,
  //   foreignDeployment: '0xbcC23c02A3EFEC4A4C86c20f6b4caCd94e41b266',
  // },
  // polygonzkevm: {
  //   ...chainMetadata.polygonzkevm,
  //   fees: 160000000000000n,
  //   foreignDeployment: '0x529C8B9685cC8db160fB7248189adaF46bD61DfD',
  // },

  // optimism: { ...chainMetadata.optimism, fees: 160000000000000n },
  // arbitrum: { ...chainMetadata.arbitrum, fees: 160000000000000n },

  blast: { ...chainMetadata.blast, fees: 88000000000000n },
  mode: { ...chainMetadata.mode, fees: 88000000000000n },
  mantapacific: { ...chainMetadata.mantapacific, fees: 88000000000000n },
  inevm: { ...chainMetadata.inevm, fees: 16000000000000000n },
};

export type CryptorankChainConfig = ChainMap<
  ChainMetadata & { fees: bigint; foreignDeployment?: Address }
>;
