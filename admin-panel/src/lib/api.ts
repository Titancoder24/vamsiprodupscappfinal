// API utility to handle base path for all API calls
const getApiUrl = (path: string): string => {
    // In Next.js with basePath, we need to prefix API calls with the base path
    const basePath = '/admin';

    // If path already starts with basePath, return it as-is
    if (path.startsWith(basePath)) {
        return path;
    }

    // Add basePath prefix
    return `${basePath}${path}`;
};

// Wrapper for fetch that automatically adds the base path
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    const url = getApiUrl(path);
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
}

export default apiFetch;
