import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';

import { MultiProvider } from '@hyperlane-xyz/sdk';
import { addressToBytes32 } from '@hyperlane-xyz/utils';

// import { addressToBytes32 } from '@hyperlane-xyz/utils';
import { log } from '../../logger.js';
import { testCrk721Configs } from '../deploy/cryptorank/erc721/config.js';
import { cryptorankERC721Factories } from '../deploy/cryptorank/erc721/contracts.js';

dotenv.config();

async function main() {
  console.info('Getting signer');
  const key = process.env.HYP_KEY ?? '';
  const signer = new Wallet(key);

  console.info('Preparing utilities');
  const multiProvider = new MultiProvider(testCrk721Configs);
  multiProvider.setSharedSigner(signer);

  // const core = HyperlaneCore.fromEnvironment('testnet', multiProvider);
  // const config = core.getRouterConfig(signer.address);

  // const router = cryptorankERC721Factories.erc721.
  const bsctestSigner = multiProvider.getSigner('bsc');
  const mumbaiSigner = multiProvider.getSigner('polygon');

  const mumbaiNetwork = await mumbaiSigner.provider!.getNetwork();
  const bsctestNetwork = await bsctestSigner.provider!.getNetwork();

  console.info('Go');

  const bscContract = cryptorankERC721Factories.erc721
    .attach('0x3577e4879DFcd45C5B17B7Af24cCd2CC7396a5f8')
    .connect(bsctestSigner);

  const mumContract = cryptorankERC721Factories.erc721
    .attach('0x90f4AF35D2c8a33A2F6dF4BDd3bbDEeBaa017Cf8')
    .connect(mumbaiSigner);

  const destGas = await bscContract.destinationGas(mumbaiNetwork.chainId);
  log(destGas.toNumber());

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
  log(balance.toNumber(), ' ', token0.toNumber());

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
