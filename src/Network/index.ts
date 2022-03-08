import { MainnetConfig } from '@/Network/constants';
import { setNetwork } from '@/Network/setNetwork';

export * from './helpers';
export * from './providers';
export * from './constants';
export * from './network';
export * from './setNetwork';
export * from './types';
export * from './utils';
export * from './getEthersProvider';

// Default connection is Mainnet
setNetwork(MainnetConfig);
