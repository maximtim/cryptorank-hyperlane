import { CommandModule } from 'yargs';

import { runKurtosisAgentDeploy } from '../deploy/agent.js';
import { runCoreDeploy } from '../deploy/core.js';
import { runCryptorank20Deploy } from '../deploy/cryptorank/cryptorank20.js';
import { runCryptorank721Deploy } from '../deploy/cryptorank/cryptorank721.js';
import { evaluateIfDryRunFailure, verifyAnvil } from '../deploy/dry-run.js';
import { runWarpRouteDeploy } from '../deploy/warp.js';
import { log, logGray } from '../logger.js';
import { ENV } from '../utils/env.js';

import {
  AgentCommandOptions,
  CoreCommandOptions,
  WarpCommandOptions,
  agentConfigCommandOption,
  agentTargetsCommandOption,
  chainsCommandOption,
  coreArtifactsOption,
  coreTargetsCommandOption,
  dryRunOption,
  hookCommandOption,
  ismCommandOption,
  keyCommandOption,
  originCommandOption,
  outDirCommandOption,
  skipConfirmationOption,
  warpConfigCommandOption,
} from './options.js';

/**
 * Parent command
 */
export const deployCommand: CommandModule = {
  command: 'deploy',
  describe: 'Permissionlessly deploy a Hyperlane contracts or extensions',
  builder: (yargs) =>
    yargs
      .command(coreCommand)
      .command(warpCommand)
      .command(agentCommand)
      .command(cryptorankERC721Command)
      .command(cryptorankERC20Command)
      .version(false)
      .demandCommand(),
  handler: () => log('Command required'),
};

/**
 * Agent command
 */
const agentCommand: CommandModule = {
  command: 'kurtosis-agents',
  describe: 'Deploy Hyperlane agents with Kurtosis',
  builder: (yargs) =>
    yargs.options<AgentCommandOptions>({
      origin: originCommandOption,
      targets: agentTargetsCommandOption,
      chains: chainsCommandOption,
      config: agentConfigCommandOption,
    }),
  handler: async (argv: any) => {
    logGray('Hyperlane Agent Deployment with Kurtosis');
    logGray('----------------------------------------');
    const chainConfigPath: string = argv.chains;
    const originChain: string = argv.origin;
    const agentConfigurationPath: string = argv.config;
    const relayChains: string = argv.targets;
    await runKurtosisAgentDeploy({
      originChain,
      relayChains,
      chainConfigPath,
      agentConfigurationPath,
    });
    process.exit(0);
  },
};

/**
 * Core command
 */
const coreCommand: CommandModule = {
  command: 'core',
  describe: 'Deploy core Hyperlane contracts',
  builder: (yargs) =>
    yargs.options<CoreCommandOptions>({
      targets: coreTargetsCommandOption,
      chains: chainsCommandOption,
      artifacts: coreArtifactsOption,
      ism: ismCommandOption,
      hook: hookCommandOption,
      out: outDirCommandOption,
      key: keyCommandOption,
      yes: skipConfirmationOption,
      'dry-run': dryRunOption,
    }),
  handler: async (argv: any) => {
    const key: string = argv.key || ENV.HYP_KEY;
    const chainConfigPath: string = argv.chains;
    const outPath: string = argv.out;
    const chains: string[] | undefined = argv.targets
      ?.split(',')
      .map((r: string) => r.trim());
    const artifactsPath: string = argv.artifacts;
    const ismConfigPath: string = argv.ism;
    const hookConfigPath: string = argv.hook;
    const skipConfirmation: boolean = argv.yes;
    const dryRun: boolean = argv.dryRun;

    logGray(
      `Hyperlane permissionless core deployment${dryRun ? ' dry-run' : ''}`,
    );
    logGray('------------------------------------------------');

    if (dryRun) await verifyAnvil();

    try {
      await runCoreDeploy({
        key,
        chainConfigPath,
        chains,
        artifactsPath,
        ismConfigPath,
        hookConfigPath,
        outPath,
        skipConfirmation,
        dryRun,
      });
    } catch (error: any) {
      evaluateIfDryRunFailure(error, dryRun);
      throw error;
    }
    process.exit(0);
  },
};

/**
 * Warp command
 */
const warpCommand: CommandModule = {
  command: 'warp',
  describe: 'Deploy Warp Route contracts',
  builder: (yargs) =>
    yargs.options<WarpCommandOptions>({
      config: warpConfigCommandOption,
      core: coreArtifactsOption,
      chains: chainsCommandOption,
      out: outDirCommandOption,
      key: keyCommandOption,
      yes: skipConfirmationOption,
    }),
  handler: async (argv: any) => {
    const key: string = argv.key || ENV.HYP_KEY;
    const chainConfigPath: string = argv.chains;
    const warpRouteDeploymentConfigPath: string | undefined = argv.config;
    const coreArtifactsPath: string | undefined = argv.core;
    const outPath: string = argv.out;
    const skipConfirmation: boolean = argv.yes;
    await runWarpRouteDeploy({
      key,
      chainConfigPath,
      warpRouteDeploymentConfigPath,
      coreArtifactsPath,
      outPath,
      skipConfirmation,
    });
    process.exit(0);
  },
};

const cryptorankERC721Command: CommandModule = {
  command: 'crk721',
  describe: 'Deploy Cryptorank ERC721 contracts',
  builder: (yargs) =>
    yargs.options({
      // config: {
      //   type: 'string',
      //   description:
      //     'A path to a JSON or YAML file with a warp route deployment config.',
      //   default: './configs/warp-route-deployment.yaml',
      // },
      // core: coreArtifactsOption,
      // chains: chainsCommandOption,
      out: outDirCommandOption,
      // key: keyCommandOption,
      // yes: skipConfirmationOption,
    }),
  handler: async (argv: any) => {
    const key: string = ENV.HYP_KEY ?? '';
    // log('KEY: ', ENV);
    log('KEY: ', key);
    // log('KEY: ', process.env);
    // const chainConfigPath: string = argv.chains;
    // const warpRouteDeploymentConfigPath: string | undefined = argv.config;
    // const coreArtifactsPath: string | undefined = argv.core;
    const outPath: string = argv.out;
    const skipConfirmation = false;
    await runCryptorank721Deploy({
      key,
      outPath,
      skipConfirmation,
    });
    process.exit(0);
  },
};

const cryptorankERC20Command: CommandModule = {
  command: 'crk20',
  describe: 'Deploy Cryptorank ERC20 contracts',
  builder: (yargs) =>
    yargs.options({
      out: outDirCommandOption,
    }),
  handler: async (argv: any) => {
    const key: string = ENV.HYP_KEY ?? '';
    log('KEY: ', key);
    const outPath: string = argv.out;
    const skipConfirmation = false;
    await runCryptorank20Deploy({
      key,
      outPath,
      skipConfirmation,
    });
    process.exit(0);
  },
};
