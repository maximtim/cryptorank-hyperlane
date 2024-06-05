import * as dotenv from 'dotenv';
import { Wallet, ethers } from 'ethers';

import { MultiProvider, cryptorankFactories } from '@hyperlane-xyz/sdk';

// import { addressToBytes32 } from '@hyperlane-xyz/utils';
import { chainCrk20Configs } from '../deploy/cryptorank/erc20/config.js';
import { log } from '../logger.js';

dotenv.config();

async function main() {
  // const num = 0.44 * 1e18;
  // console.log(num);
  // console.log(1e1);
  // console.log(1e2);

  console.info('Getting signer');
  const key = process.env.HYP_KEY ?? '';
  const signer = new Wallet(key);

  console.info('Preparing utilities');
  const multiProvider = new MultiProvider(chainCrk20Configs);
  multiProvider.setSharedSigner(signer);

  // const core = HyperlaneCore.fromEnvironment('testnet', multiProvider);
  // const config = core.getRouterConfig(signer.address);

  // const router = cryptorankERC721Factories.erc721.
  const bsctestSigner = multiProvider.getSigner('bsc');
  const mumbaiSigner = multiProvider.getSigner('inevm');

  const mumbaiNetwork = await mumbaiSigner.provider!.getNetwork();
  const bsctestNetwork = await bsctestSigner.provider!.getNetwork();

  console.info('Go');

  const bscContract = cryptorankFactories.erc20
    .attach('0xe4f10D31329d1c42961C4106FDcA8D7E12e5fA9e')
    .connect(bsctestSigner);

  const mumContract = cryptorankFactories.erc20
    .attach('0xe06D91fe2B448cBf7195709F2F7a25DfD8d33fDa')
    .connect(mumbaiSigner);

  const destGas = await bscContract.destinationGas(mumbaiNetwork.chainId);
  log(destGas.toNumber().toString());

  // const mailbox = await bscContract.mailbox();
  // log(mailbox);

  const gas = await bscContract.quoteGasPayment(mumbaiNetwork.chainId);
  log(gas.toString());

  const gas2 = await mumContract.quoteGasPayment(bsctestNetwork.chainId);
  log(gas2.toString());

  const balance = await bscContract.balanceOf(
    '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  );
  // const token1 = await mumContract.tokenOfOwnerByIndex(
  //   '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  //   1,
  // );
  log(ethers.utils.formatEther(balance));

  // const estimate = await mumContract.estimateGas[
  //   'transferRemote(uint32,bytes32,uint256,string)'
  // ](
  //   bsctestNetwork.chainId,
  //   addressToBytes32('0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB'),
  //   balance.div(2),
  //   'test bridge',
  //   { value: gas2 },
  // );

  // log(estimate.toNumber().toString());

  // const hook = await mumContract.hook();
  // console.log(hook);

  // const owner = await mumContract.owner();
  // console.log(owner);

  // const txHook = await mumContract.setHook(
  //   '0x19dc38aeae620380430C200a6E990D5Af5480117',
  // );
  // await txHook.wait();

  // const hook2 = await mumContract.hook();
  // console.log(hook2);

  // const tx = await mumContract['transferRemote(uint32,bytes32,uint256,string)'](
  //   bsctestNetwork.chainId,
  //   addressToBytes32('0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB'),
  //   balance.div(10),
  //   'test bridge',
  //   { value: gas2 }, // + 5%
  // );

  // await tx.wait();
  // log(tx.hash);

  // const mintTx = await bscContract.mintBatch(3, 'test mint', { value: 3000 });
  // log(mintTx.hash);
}

main()
  .then(() => console.info('Finished'))
  .catch(console.error);
