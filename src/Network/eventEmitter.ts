import { NetworkConfig } from '@/Network/types';
import EventEmitter from 'events';

/**
 * Fire network change event
 * @param newNetwork The newly connected network config
 */
export function emitNetworkChange(newNetwork: NetworkConfig) {
    networkEvents.emit('network_change', newNetwork);
}

export const networkEvents: EventEmitter = new EventEmitter();
