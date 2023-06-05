export async function fetchRetry(
    url: string,
    params?: RequestInit,
    retries = 5,
): Promise<string> {
    while (true) {
        try {
            return await fetch(url, params).then((i) => i.text())
        } catch (e) {
            if (!retries--) {
                throw e
            }
        }
    }
}
