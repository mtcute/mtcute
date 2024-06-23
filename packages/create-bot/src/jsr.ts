export async function fetchLatestVersionJsr(pkg: string): Promise<string> {
    const res = await fetch(`https://jsr.io/${pkg}/meta.json`)

    if (!res.ok) {
        throw new Error(`Failed to fetch ${pkg} metadata: ${await res.text()}`)
    }

    const meta = (await res.json()) as {
        latest: string
    }

    return meta.latest
}

export async function fetchAllLatestVersionsJsr(pkgs: string[]): Promise<Map<string, string>> {
    const res = new Map<string, string>()

    await Promise.all(
        pkgs.map(async (pkg) => {
            res.set(pkg, await fetchLatestVersionJsr(pkg))
        }),
    )

    return res
}
