import * as dotenv from 'dotenv';
import { Wallet } from 'ethers';

import { MultiProvider, cryptorankFactories } from '@hyperlane-xyz/sdk';

import { chainCrk20Configs } from '../deploy/cryptorank/erc20/config.js';

dotenv.config();

async function main() {
  console.info('Getting signer');
  const key = process.env.HYP_KEY ?? '';
  const signer = new Wallet(key);

  console.info('Preparing utilities');
  const multiProvider = new MultiProvider(chainCrk20Configs);
  multiProvider.setSharedSigner(signer);
  const inevmSigner = multiProvider.getSigner('inevm');

  console.info('Go');

  const contract = cryptorankFactories.erc20
    .attach('0xe06D91fe2B448cBf7195709F2F7a25DfD8d33fDa')
    .connect(inevmSigner);

  const hook = await contract.hook();
  console.log(hook);

  const owner = await contract.owner();
  console.log(owner);

  const txHook = await contract.setHook(
    '0x19dc38aeae620380430C200a6E990D5Af5480117',
  );
  await txHook.wait();

  const hook2 = await contract.hook();
  console.log(hook2);
}

main()
  .then(() => console.info('Finished'))
  .catch(console.error);
