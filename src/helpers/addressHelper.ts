import { BinTools } from 'avalanche';
export const bintools: BinTools = BinTools.getInstance();

export const validateAddress = (address: string): boolean | string => {
    try {
        bintools.stringToAddress(address);
        return true;
    } catch (error) {
        return error.message;
    }
};

export default {
    validateAddress,
};
