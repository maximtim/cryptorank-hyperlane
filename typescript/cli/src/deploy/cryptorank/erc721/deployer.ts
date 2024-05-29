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

// import { CryptorankFactories } from '../contracts.js';
import { CryptorankERC721Config } from './config.js';

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
    _config: CryptorankERC721Config,
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
      config.baseUri,
      config.chainId,
      config.fees,
      config.owner,
    ];
  }

  router(contracts: HyperlaneContracts<CryptorankFactories>) {
    return contracts.erc721;
  }

  async deployContracts(chain: ChainName, config: CryptorankERC721Config) {
    const { [this.routerContractKey(config)]: router, proxyAdmin } =
      await super.deployContracts(chain, config);

    await this.configureClient(chain, router as MailboxClient, config);
    return { [config.type]: router, proxyAdmin } as any;
  }

  async deploy(configMap: ChainMap<CryptorankERC721Config>) {
    return super.deploy(configMap);
  }
}
