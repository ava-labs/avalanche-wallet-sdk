export class HttpClient {
    private TIMEOUT = 10000;

    constructor(private baseURL: string) {}

    get<T>(path: string, params?: Record<string, any>): Promise<T> {
        const query = params && new URLSearchParams(params);
        path = query ? `${path}?${query.toString()}` : path;
        const url = `${this.baseURL}/${path}`;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };
        return this.handleResponse<T>(this.fetchWithTimeout(url, options));
    }

    post<T>(path: string, data: Record<string, any>): Promise<T> {
        const url = `${this.baseURL}/${path}`;
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        };
        return this.handleResponse<T>(this.fetchWithTimeout(url, options));
    }

    private async handleResponse<T>(responsePromise: Promise<Response>): Promise<T> {
        const response = await responsePromise;
        if (response.ok) {
            return await response.json();
        } else {
            const errorMessage = await response.text();
            return Promise.reject(new Error(errorMessage));
        }
    }

    private async fetchWithTimeout(input: RequestInfo, options: RequestInit & { timeout?: number } = {}) {
        const { timeout = this.TIMEOUT } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(input, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    }
}
