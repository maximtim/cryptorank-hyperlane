import { confirm } from '@inquirer/prompts';
import { ethers } from 'ethers';

import {
  ChainMap,
  ChainName,
  CryptorankFactories,
  HyperlaneContractsMap,
  MultiProvider,
  TokenStandard,
  WarpCoreConfig,
  getTokenConnectionId,
} from '@hyperlane-xyz/sdk';
import { Address, ProtocolType, objMap } from '@hyperlane-xyz/utils';

import { MINIMUM_WARP_DEPLOY_GAS } from '../../consts.js';
import { getContext, getMergedContractAddresses } from '../../context.js';
import { log, logBlue, logGray, logGreen } from '../../logger.js';
import { prepNewArtifactsFiles, writeJson } from '../../utils/files.js';
import { runPreflightChecksForChains } from '../utils.js';

import {
  Cryptorank20ChainConfig,
  CryptorankERC20Config,
  chainCrk20Configs,
  globalCrk20Config,
} from './erc20/config.js';
import { CryptorankERC20Deployer } from './erc20/deployer.js';

export async function runCryptorank20Deploy({
  key,
  outPath,
  skipConfirmation,
}: {
  key: string;
  outPath: string;
  skipConfirmation: boolean;
}) {
  const { multiProvider, signer, coreArtifacts } = await getContext({
    // chainConfigPath,
    // coreConfig: { coreArtifactsPath },
    keyConfig: { key },
    skipConfirmation,
  });

  const configs = await runBuildConfigStep({
    coreArtifacts,
    signer,
    chainConfig: chainCrk20Configs,
  });

  const deploymentParams = {
    ...configs,
    chains: Object.keys(configs.configMap),
    signer,
    multiProvider,
    outPath,
    skipConfirmation,
  };

  logBlue('Warp route deployment plan');

  await runDeployPlanStep(deploymentParams);
  await runPreflightChecks({
    ...deploymentParams,
    minGas: MINIMUM_WARP_DEPLOY_GAS,
  });
  await executeDeploy(deploymentParams);
}

export async function runPreflightChecks({
  chains,
  signer,
  multiProvider,
  minGas,
  chainsToGasCheck,
}: {
  chains: ChainName[];
  signer: ethers.Signer;
  multiProvider: MultiProvider;
  minGas: string;
  chainsToGasCheck?: ChainName[];
}) {
  log('Running pre-flight checks...');

  if (!chains?.length) throw new Error('Invalid chain selection');
  logGreen('Chain selections are valid ✅');

  return runPreflightChecksForChains({
    chains,
    signer,
    multiProvider,
    minGas,
    chainsToGasCheck,
  });
}

async function runBuildConfigStep({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signer,
  coreArtifacts,
  chainConfig,
}: {
  signer: ethers.Signer;
  coreArtifacts?: HyperlaneContractsMap<any>;
  chainConfig: Cryptorank20ChainConfig;
}) {
  log('Assembling token configs');

  // const owner = await signer.getAddress();

  const mergedContractAddrs = getMergedContractAddresses(
    coreArtifacts,
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
        fees: config.fees,
        foreignDeployment: config.foreignDeployment,
      };
    },
  );

  log('Token configs ready');
  return {
    configMap,
  };
}

interface DeployParams {
  configMap: ChainMap<CryptorankERC20Config>;
  signer: ethers.Signer;
  multiProvider: MultiProvider;
  outPath: string;
  skipConfirmation: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runDeployPlanStep({ signer, skipConfirmation }: DeployParams) {
  const address = await signer.getAddress();
  logBlue('\nDeployment plan');
  logGray('===============');
  log(`Transaction signer and owner of new contracts will be ${address}`);

  if (skipConfirmation) return;

  const isConfirmed = await confirm({
    message: 'Is this deployment plan correct?',
  });
  if (!isConfirmed) throw new Error('Deployment cancelled');
}

async function executeDeploy(params: DeployParams) {
  logBlue('All systems ready, captain! Beginning deployment...');

  const { configMap, multiProvider, outPath } = params;

  const [contractsFilePath, tokenConfigPath] = prepNewArtifactsFiles(outPath, [
    { filename: 'warp-route-deployment', description: 'Contract addresses' },
    { filename: 'warp-config', description: 'Warp config' },
  ]);

  const deployer = new CryptorankERC20Deployer(multiProvider);

  const deployedContracts = await deployer.deploy(configMap);
  logGreen('Hyp token deployments complete');

  log('Writing deployment artifacts');
  writeTokenDeploymentArtifacts(contractsFilePath, deployedContracts, params);
  writeWarpUiTokenConfig(tokenConfigPath, deployedContracts, params);

  logBlue('Deployment is complete!');
  logBlue(`Contract address artifacts are in ${contractsFilePath}`);
  logBlue(`Warp config is in ${tokenConfigPath}`);
}

function writeTokenDeploymentArtifacts(
  filePath: string,
  contracts: HyperlaneContractsMap<CryptorankFactories>,
  { configMap }: DeployParams,
) {
  const artifacts: ChainMap<{
    router: Address;
    tokenType: string;
  }> = objMap(contracts, (chain, contract) => {
    return {
      router:
        contract[configMap[chain].type as keyof CryptorankFactories].address,
      tokenType: configMap[chain].type,
    };
  });
  writeJson(filePath, artifacts);
}

function writeWarpUiTokenConfig(
  filePath: string,
  contracts: HyperlaneContractsMap<CryptorankFactories>,
  { configMap }: DeployParams,
) {
  const warpCoreConfig: WarpCoreConfig = { tokens: [] };

  // First pass, create token configs
  for (const [chainName, contract] of Object.entries(contracts)) {
    const config = configMap[chainName];
    warpCoreConfig.tokens.push({
      chainName,
      standard: TokenStandard.ERC20,
      name: config.name,
      symbol: config.symbol,
      decimals: config.decimals,
      addressOrDenom:
        contract[configMap[chainName].type as keyof CryptorankFactories]
          .address,
    });
  }

  // Second pass, add connections between tokens
  // Assumes full interconnectivity between all tokens for now b.c. that's
  // what the deployers do by default.
  for (const token1 of warpCoreConfig.tokens) {
    for (const token2 of warpCoreConfig.tokens) {
      if (
        token1.chainName === token2.chainName &&
        token1.addressOrDenom === token2.addressOrDenom
      )
        continue;
      token1.connections ||= [];
      token1.connections.push({
        token: getTokenConnectionId(
          ProtocolType.Ethereum,
          token2.chainName,
          token2.addressOrDenom!,
        ),
      });
    }
  }

  writeJson(filePath, warpCoreConfig);
}
