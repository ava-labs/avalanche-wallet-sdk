import BinTools from 'avalanche/dist/utils/bintools';
export const bintools: BinTools = BinTools.getInstance();

export const validateAddress = (address: string): boolean => {
    try {
        bintools.stringToAddress(address);
        return true;
    } catch (error) {
        console.log('error', error);

        return false;
    }
};

export default {
    validateAddress,
};
