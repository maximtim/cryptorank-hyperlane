import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';

import {
  // CryptorankNFT__factory,
  TokenRouter__factory,
} from '@hyperlane-xyz/core';
import { MultiProvider } from '@hyperlane-xyz/sdk';

import { chainCrk20Configs } from '../deploy/cryptorank/erc20/config.js';

dotenv.config();

async function main() {
  console.info('Getting signer');
  const key = process.env.HYP_KEY ?? '';
  const signer = new Wallet(key);

  console.info('Preparing utilities');
  const multiProvider = new MultiProvider(chainCrk20Configs);
  multiProvider.setSharedSigner(signer);
  const inevmSigner = multiProvider.getSigner('arbitrum');

  console.info('Go');

  // const contract = cryptorankFactories.erc20
  //   .attach('0xe06D91fe2B448cBf7195709F2F7a25DfD8d33fDa')
  //   .connect(inevmSigner);

  const contract = TokenRouter__factory.connect(
    '0x1fcce39ccbe226ba69e277721d87516bee236e33',
    inevmSigner,
  );

  const hook = await contract.hook();
  console.log(hook);

  // const x = contract.filters.ReferralBridge();

  const owner = await contract.owner();
  console.log(owner);

  // const txHook = await contract.setHook(
  //   '0x19dc38aeae620380430C200a6E990D5Af5480117',
  // );
  // await txHook.wait();

  const destGas = await contract.destinationGas(169);
  console.log(destGas.toNumber().toString());

  // const hook2 = await contract.hook();
  // console.log(hook2);
}

main()
  .then(() => console.info('Finished'))
  .catch(console.error);
