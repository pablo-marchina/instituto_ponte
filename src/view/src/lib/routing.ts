const normalizeBasePath = (basePath: string | undefined) => {
  if (!basePath || basePath === "/") return "/";
  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export const appBasePath = normalizeBasePath(import.meta.env.BASE_URL);
export const appRouterBasename = appBasePath === "/" ? "/" : appBasePath.replace(/\/$/, "");

export function withAppBasePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (appBasePath === "/") return normalizedPath;
  return `${appBasePath.replace(/\/$/, "")}${normalizedPath}`;
}

export function appAbsoluteUrl(path: string) {
  return `${window.location.origin}${withAppBasePath(path)}`;
}

export function stripAppBasePath(pathname: string) {
  if (appBasePath === "/") return pathname;
  const baseWithoutTrailingSlash = appBasePath.replace(/\/$/, "");
  if (pathname === baseWithoutTrailingSlash) return "/";
  if (!pathname.startsWith(`${baseWithoutTrailingSlash}/`)) return pathname;
  return pathname.slice(baseWithoutTrailingSlash.length) || "/";
}
