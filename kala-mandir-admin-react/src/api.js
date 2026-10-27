const API_URL = "https://kalamandir.online/api";

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || `Request failed (${response.status})`);
  }
  return result;
}

export function uploadRequest(
  path,
  { token, method = "POST", body, onProgress },
) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, `${API_URL}${path}`);
    request.setRequestHeader("Authorization", `Bearer ${token}`);

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      let result;
      try {
        result = JSON.parse(request.responseText);
      } catch {
        reject(new Error(`Request failed (${request.status})`));
        return;
      }
      if (
        request.status < 200 ||
        request.status >= 300 ||
        result?.success === false
      ) {
        reject(
          new Error(result?.message || `Request failed (${request.status})`),
        );
        return;
      }
      resolve(result);
    });

    request.addEventListener("error", () => {
      reject(
        new Error(
          "Network error while uploading. Check your connection and retry.",
        ),
      );
    });
    request.addEventListener("abort", () =>
      reject(new Error("Upload was cancelled.")),
    );
    request.send(body);
  });
}

export function normalizeMedia(item) {
  return {
    ...item,
    id: item._id,
    categoryId: item.categoryId,
    thumb: item.thumbnailUrl || item.url,
  };
}

export function normalizeCategory(category) {
  return {
    ...category,
    id: category._id,
    subcategories: category.subcategories || [],
  };
}
