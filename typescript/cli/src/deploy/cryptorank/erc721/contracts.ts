import { cryptorankFactories } from '@hyperlane-xyz/sdk';

export const cryptorankERC721Factories = {
  erc721: cryptorankFactories.erc721,
};

export type CryptorankERC721Factories = typeof cryptorankERC721Factories;
