// import { ethers } from 'ethers';
import debug from 'debug';

import {
  ChainMap,
  ChainName,
  ContractVerifier,
  GasRouterDeployer,
  HyperlaneContracts,
  MultiProvider,
} from '@hyperlane-xyz/sdk';

import { CryptorankERC721Config } from './config.js';
import {
  CryptorankERC721Factories,
  cryptorankERC721Factories,
} from './contracts.js';

export class CryptorankERC721Deployer extends GasRouterDeployer<
  CryptorankERC721Config,
  CryptorankERC721Factories
> {
  constructor(
    multiProvider: MultiProvider,
    readonly contractVerifier?: ContractVerifier,
  ) {
    super(multiProvider, cryptorankERC721Factories, {
      logger: debug('hyperlane:CryptorankERC721Deployer'),
      contractVerifier,
    });
  }

  router(contracts: HyperlaneContracts<CryptorankERC721Factories>) {
    return contracts.erc721;
  }

  // Custom contract deployment logic can go here
  // If no custom logic is needed, call deployContract for the router
  async deployContracts(chain: ChainName, config: CryptorankERC721Config) {
    const router = await this.deployContract(
      chain,
      'erc721',
      [config.mailbox],
      [config.name, config.symbol, config.chainId, config.fees, config.owner],
    );
    return {
      erc721: router,
    };
  }

  async deploy(configMap: ChainMap<CryptorankERC721Config>) {
    // const mergedConfig = objMap(configMap, (chain, config) => {
    //   return {
    //     ...config,
    //   };
    // }) as ChainMap<CryptorankERC721Config>;

    return super.deploy(configMap);
  }
}
