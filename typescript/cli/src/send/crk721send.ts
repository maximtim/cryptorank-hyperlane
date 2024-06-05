import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';

import { MultiProvider, cryptorankFactories } from '@hyperlane-xyz/sdk';
import { addressToBytes32 } from '@hyperlane-xyz/utils';

import { chainCrk721Configs } from '../deploy/cryptorank/erc721/config.js';
// import { addressToBytes32 } from '@hyperlane-xyz/utils';
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
  const multiProvider = new MultiProvider(chainCrk721Configs);
  multiProvider.setSharedSigner(signer);

  // const core = HyperlaneCore.fromEnvironment('testnet', multiProvider);
  // const config = core.getRouterConfig(signer.address);

  // const router = cryptorankERC721Factories.erc721.
  const bsctestSigner = multiProvider.getSigner('sepolia');
  const mumbaiSigner = multiProvider.getSigner('bsctestnet');

  const mumbaiNetwork = await mumbaiSigner.provider!.getNetwork();
  const bsctestNetwork = await bsctestSigner.provider!.getNetwork();

  console.info('Go');

  const bscContract = cryptorankFactories.erc721
    .attach('0x979723b0832341db34d329123F208E0f9e8E6c66')
    .connect(bsctestSigner);

  const mumContract = cryptorankFactories.erc721
    .attach('0x8ff85Ec96fa44da00F9A80cd138A4E7d37F6ee12')
    .connect(mumbaiSigner);

  const destGas = await bscContract.destinationGas(mumbaiNetwork.chainId);
  log(destGas.toNumber().toString());

  // const mailbox = await bscContract.mailbox();
  // log(mailbox);

  const gas = await bscContract.quoteGasPayment(mumbaiNetwork.chainId);
  log(gas.toString());

  const gas2 = await mumContract.quoteGasPayment(bsctestNetwork.chainId);
  log(gas2.toString());

  const balance = await mumContract.balanceOf(
    '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  );
  const token0 = await mumContract.tokenOfOwnerByIndex(
    '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
    0,
  );
  // const token1 = await mumContract.tokenOfOwnerByIndex(
  //   '0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB',
  //   1,
  // );
  log(balance.toNumber().toString(), ' ', token0.toNumber());

  const tx = await bscContract['transferRemote(uint32,bytes32,uint256,string)'](
    mumbaiNetwork.chainId,
    addressToBytes32('0x069AfcBc2b655Ac8586F7fC6C60e45f4f4BBb6bB'),
    bsctestNetwork.chainId * 10 ** 7 + 1,
    'test bridge',
    { value: gas },
  );

  await tx.wait();
  log(tx.hash);

  // const mintTx = await bscContract.mintBatch(3, 'test mint', { value: 3000 });
  // log(mintTx.hash);
}

main()
  .then(() => console.info('Finished'))
  .catch(console.error);
