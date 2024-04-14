// import { ethers } from 'ethers';
import { MailboxClient } from '@hyperlane-xyz/core';
import {
  ChainMap,
  ChainName,
  ContractVerifier,
  CryptorankContracts,
  CryptorankFactories,
  GasRouterDeployer,
  HyperlaneContracts,
  MultiProvider,
  cryptorankContracts,
  cryptorankFactories,
} from '@hyperlane-xyz/sdk';
import { rootLogger } from '@hyperlane-xyz/utils';

import { CryptorankERC721Config } from './config.js';
import { CryptorankERC721Factories } from './contracts.js';

export class CryptorankERC721Deployer extends GasRouterDeployer<
  CryptorankERC721Config,
  CryptorankFactories
> {
  constructor(
    multiProvider: MultiProvider,
    readonly contractVerifier?: ContractVerifier,
  ) {
    super(multiProvider, cryptorankFactories, {
      logger: rootLogger.child({ module: 'CryptorankERC721Deployer' }),
      contractVerifier,
    });
  }

  routerContractName(config: CryptorankERC721Config): string {
    return cryptorankContracts[this.routerContractKey(config)];
  }

  routerContractKey<K extends keyof CryptorankContracts>(
    config: CryptorankERC721Config,
  ): K {
    return 'erc721' as K;
  }

  async constructorArgs(
    _: ChainName,
    config: CryptorankERC721Config,
  ): Promise<any> {
    return [config.mailbox];
  }

  async initializeArgs(
    _: ChainName,
    config: CryptorankERC721Config,
  ): Promise<any> {
    return [
      config.name,
      config.symbol,
      config.chainId,
      config.fees,
      config.owner,
    ];
  }

  router(contracts: HyperlaneContracts<CryptorankERC721Factories>) {
    return contracts.erc721;
  }

  // Custom contract deployment logic can go here
  // If no custom logic is needed, call deployContract for the router
  async deployContracts(chain: ChainName, config: CryptorankERC721Config) {
    // const router = await this.deployContract(
    //   chain,
    //   'erc721',
    //   [config.mailbox],
    //   [config.name, config.symbol, config.chainId, config.fees, config.owner],
    // );
    // return {
    //   erc721: router,
    // };

    const { [this.routerContractKey(config)]: router } =
      await super.deployContracts(chain, config);

    await this.configureClient(chain, router as MailboxClient, config);
    return { [config.type]: router } as any;
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
