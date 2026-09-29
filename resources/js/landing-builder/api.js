import axios from "axios";

// axios sends the XSRF cookie as X-XSRF-TOKEN automatically, so Laravel's CSRF protection applies.
const http = axios.create({
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    withCredentials: true,
});

/** Turn any failure into { message, errors } suitable for a toast / inline error. */
export function errorInfo(err) {
    const res = err?.response;
    if (!res) return { message: "Network error - check your connection.", errors: {}, status: 0 };
    const data = res.data || {};
    let message = data.message || "Something went wrong.";
    if (res.status === 419) message = "Your session expired. Reload the page to continue.";
    if (res.status === 403) message = data.message && data.message !== "" ? data.message : "You do not have permission to do that.";
    if (res.status === 422 && data.errors) {
        const first = Object.values(data.errors)[0];
        message = Array.isArray(first) ? first[0] : message;
    }
    return { message, errors: data.errors || {}, status: res.status };
}

/** Retries transient failures (network / 5xx) with a short backoff. Never retries 4xx. */
export async function withRetry(fn, tries = 3) {
    let last;
    for (let i = 0; i < tries; i++) {
        try {
            return await fn();
        } catch (e) {
            last = e;
            const s = e?.response?.status;
            if (s && s < 500) throw e;
            await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        }
    }
    throw last;
}

export const api = {
    get: (url, params) => http.get(url, { params }).then((r) => r.data),
    post: (url, data) => http.post(url, data).then((r) => r.data),
    put: (url, data) => http.put(url, data).then((r) => r.data),
    patch: (url, data) => http.patch(url, data).then((r) => r.data),
    delete: (url) => http.delete(url).then((r) => r.data),
    upload: (url, file, onProgress) => {
        const fd = new FormData();
        fd.append("file", file);
        return http.post(url, fd, { onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)) }).then((r) => r.data);
    },
};
