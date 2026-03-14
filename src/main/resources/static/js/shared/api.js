export async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        if (body && typeof body === "object") {
            throw new Error(body.error || Object.values(body).join(", ") || "Bir hata olustu.");
        }

        throw new Error(typeof body === "string" && body ? body : "Bir hata olustu.");
    }

    return body;
}
