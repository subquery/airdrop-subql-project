// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FrontierEvmEvent } from '@subql/frontier-evm-processor';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { User, Exception } from '../../types';

export const getUpsertAt = (
  handler: string,
  event: FrontierEvmEvent
): string => {
  const upsertAt = `${handler}:${event.blockNumber}:${
    event.transactionHash ?? ''
  }`;
  return upsertAt;
};

export const getErrorText = (handler: string, error: string) => {
  return `${handler}:${error}`;
};

export const recordException = async (
  handler: string,
  event: FrontierEvmEvent,
  error: string
): Promise<void> => {
  const exception = Exception.create({
    id: getUpsertAt(handler, event),
    error,
  });

  await exception.save();
};

export const toBigNumber = (amount: BigNumberish) =>
  BigNumber.from(amount.toString());

export const upsertUser = async (
  address: string,
  airdropAmount: BigNumberish,
  claimedAmount: BigNumberish,
  event: FrontierEvmEvent
) => {
  const HANDLER = 'upsertUser';
  const user = await User.get(address);

  if (user) {
    user.totalAirdropAmount = toBigNumber(user.totalAirdropAmount)
      .add(toBigNumber(airdropAmount))
      .toBigInt();
    user.claimedAmount = toBigNumber(user.claimedAmount)
      .add(toBigNumber(claimedAmount))
      .toBigInt();
    user.updateAt = getUpsertAt(HANDLER, event);

    await user.save();
  } else {
    logger.info(`${HANDLER} - create: ${event.transactionHash ?? ''}`);
    const newAddress = new User(address);
    newAddress.totalAirdropAmount = toBigNumber(airdropAmount).toBigInt();
    newAddress.claimedAmount = toBigNumber(claimedAmount).toBigInt();
    newAddress.createAt = getUpsertAt(HANDLER, event);
    await newAddress.save();
  }
};
