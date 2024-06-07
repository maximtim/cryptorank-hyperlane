// import { ethers } from 'ethers';
import { Contract } from 'ethers';

import {
  ITransparentUpgradeableProxy,
  MailboxClient,
} from '@hyperlane-xyz/core';
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

import { CryptorankERC20Config } from './config.js';

export class CryptorankERC20Deployer extends GasRouterDeployer<
  CryptorankERC20Config,
  CryptorankFactories
> {
  constructor(
    multiProvider: MultiProvider,
    readonly contractVerifier?: ContractVerifier,
  ) {
    super(multiProvider, cryptorankFactories, {
      logger: rootLogger.child({ module: 'CryptorankERC20Deployer' }),
      contractVerifier,
    });
  }

  routerContractName(config: CryptorankERC20Config): string {
    return cryptorankContracts[this.routerContractKey(config)];
  }

  routerContractKey<K extends keyof CryptorankContracts>(
    _config: CryptorankERC20Config,
  ): K {
    return 'erc20' as K;
  }

  async constructorArgs(
    _: ChainName,
    config: CryptorankERC20Config,
  ): Promise<any> {
    return [config.decimals, config.mailbox];
  }

  async initializeArgs(
    _: ChainName,
    config: CryptorankERC20Config,
  ): Promise<any> {
    return [
      config.initialSupply,
      config.name,
      config.symbol,
      config.mintFee,
      config.bridgeFee,
      config.owner,
    ];
  }

  router(contracts: HyperlaneContracts<CryptorankFactories>) {
    return contracts.erc20;
  }

  async deployContracts(chain: ChainName, config: CryptorankERC20Config) {
    const { [this.routerContractKey(config)]: router, proxyAdmin } =
      await super.deployContracts(chain, config);

    await this.configureClient(chain, router as MailboxClient, config);
    return { [config.type]: router, proxyAdmin } as any;
  }

  async deploy(configMap: ChainMap<CryptorankERC20Config>) {
    return super.deploy(configMap);
  }

  async upgradeAndInitialize<C extends Contract>(
    chain: string,
    proxy: ITransparentUpgradeableProxy,
    implementation: C,
    initializeArgs: Parameters<C['initialize']>,
  ): Promise<void> {
    return super.upgradeAndInitialize(
      chain,
      proxy,
      implementation,
      initializeArgs,
    );
  }
}
