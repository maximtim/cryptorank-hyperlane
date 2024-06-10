import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';

import '@hyperlane-xyz/core';
import { ITransparentUpgradeableProxy__factory } from '@hyperlane-xyz/core';
import {
  ChainMap,
  MultiProvider,
  cryptorankContracts,
} from '@hyperlane-xyz/sdk';
import { objMap } from '@hyperlane-xyz/utils';

import { getMergedContractAddresses } from '../context.js';
import {
  CryptorankERC20Config,
  chainCrk20Configs,
  globalCrk20Config,
} from '../deploy/cryptorank/erc20/config.js';
import { CryptorankERC20Deployer } from '../deploy/cryptorank/erc20/deployer.js';

dotenv.config();

async function main() {
  console.info('Getting signer');
  const key = process.env.HYP_KEY ?? '';
  const signer = new Wallet(key);

  console.info('Preparing utilities');
  const multiProvider = new MultiProvider(chainCrk20Configs);
  multiProvider.setSharedSigner(signer);
  // const inevmSigner = multiProvider.getSigner('arbitrum');
  const chainConfig = chainCrk20Configs;

  const mergedContractAddrs = getMergedContractAddresses(
    undefined,
    Object.keys(chainConfig),
  );

  const configMap: ChainMap<CryptorankERC20Config> = objMap(
    chainConfig,
    (chainName, config) => {
      return {
        type: globalCrk20Config.type,
        mailbox: mergedContractAddrs[chainName].mailbox,
        owner: globalCrk20Config.owner,
        ownerOverrides: {
          erc20: globalCrk20Config.ownerOverride,
          proxyAdmin: globalCrk20Config.ownerOverride,
        },
        gas: globalCrk20Config.gas,
        chainId: config.chainId,
        initialSupply: globalCrk20Config.initialSupply,
        decimals: globalCrk20Config.decimals,
        name: globalCrk20Config.name,
        symbol: globalCrk20Config.symbol,
        mintFee: config.mintFee,
        bridgeFee: config.bridgeFee,
        foreignDeployment: config.foreignDeployment,
      };
    },
  );

  const deployer = new CryptorankERC20Deployer(multiProvider);

  console.info();
  console.info('Start');
  console.info();

  for (const [chainName, config] of Object.entries(configMap)) {
    console.info('Deploy new implementation on: ', chainName);
    const implementation = await deployer.deployContractWithName(
      chainName,
      'erc20',
      cryptorankContracts.erc20,
      await deployer.constructorArgs(chainName, config),
    );
    console.info('Deploy done on: ', chainName);

    const proxy = ITransparentUpgradeableProxy__factory.connect(
      config.foreignDeployment!,
      multiProvider.getSigner(chainName),
    );

    console.info('Upgrade start on: ', chainName);
    await deployer.upgrade(chainName, proxy, implementation);
    console.info('Upgrade done on: ', chainName);
  }
}

main()
  .then(() => console.info('Finished'))
  .catch(console.error);
