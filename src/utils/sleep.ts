export async function sleep(durMs: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, durMs);
    });
}
