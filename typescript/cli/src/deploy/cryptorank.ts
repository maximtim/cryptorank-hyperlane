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

import { MINIMUM_WARP_DEPLOY_GAS } from '../consts.js';
import { getContext, getMergedContractAddresses } from '../context.js';
import { log, logBlue, logGray, logGreen } from '../logger.js';
import { prepNewArtifactsFiles, writeJson } from '../utils/files.js';

import {
  CryptorankChainConfig,
  CryptorankERC721Config,
  testCrk721Configs,
} from './cryptorank/erc721/config.js';
import { CryptorankERC721Deployer } from './cryptorank/erc721/deployer.js';
import { runPreflightChecksForChains } from './utils.js';

export async function runCryptorankDeploy({
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
    chainConfig: testCrk721Configs,
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
  signer,
  coreArtifacts,
  chainConfig,
}: {
  signer: ethers.Signer;
  coreArtifacts?: HyperlaneContractsMap<any>;
  chainConfig: CryptorankChainConfig;
}) {
  log('Assembling token configs');

  // const owner = await signer.getAddress();

  const mergedContractAddrs = getMergedContractAddresses(
    coreArtifacts,
    Object.keys(chainConfig),
  );

  const configMap: ChainMap<CryptorankERC721Config> = objMap(
    chainConfig,
    (chainName, config) => {
      return {
        type: 'erc721',
        mailbox: mergedContractAddrs[chainName].mailbox,
        owner: '0xBE135bcF2B6F05e2AD5a3a227E15222Bfd7c0B22',
        gas: 200_000,
        chainId: config.chainId,
        name: 'Cryptorank Hyperlane NFT',
        symbol: 'hCRK',
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
  configMap: ChainMap<CryptorankERC721Config>;
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

  const deployer = new CryptorankERC721Deployer(multiProvider);

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
      standard: TokenStandard.ERC721,
      name: config.name,
      symbol: config.symbol,
      decimals: 0,
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
