const ACCESS_TOKEN_KEY = "optio_access_token";

export function saveAccessToken(
  token: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    token,
  );
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    ACCESS_TOKEN_KEY,
  );
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
}