export function strip0x(addr: string) {
    if (addr.substring(0, 2) === '0x') {
        return addr.substring(2);
    }
    return addr;
}
