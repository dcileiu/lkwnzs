type ImageRecord = {
  url: string;
  altText?: string;
  sortOrder: number;
};

export type StoredImageRecord = {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  createdAt?: Date;
};

const DEFAULT_CDN_DOMAIN = "https://wallpaper.cdn.itianci.cn";
// 项目自己拥有的域名族：所有 *.itianci.cn 子域（包括历史域名 roco.itianci.cn、
// 当前 CDN wallpaper.cdn.itianci.cn 等）都视为站内资源，统一剥离 host 改用相对路径，
// 这样 resolveImageUrl 可以用最新的 QINIU_DOMAIN 重新拼接。
const PROJECT_HOST_EXACT = "itianci.cn";
const PROJECT_HOST_SUFFIX = ".itianci.cn";

function isProjectOwnedHost(host: string) {
  const lower = host.toLowerCase();
  return lower === PROJECT_HOST_EXACT || lower.endsWith(PROJECT_HOST_SUFFIX);
}

function normalizeDomain(domain: string) {
  const trimmed = domain.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getCdnDomain() {
  const fromEnv = process.env.QINIU_DOMAIN?.trim();
  return normalizeDomain(fromEnv || DEFAULT_CDN_DOMAIN);
}

function decodePathname(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

function normalizeImageSuffix(value: string) {
  return value.trim().replace(/\.wepb(\?|#|$)/gi, ".webp$1");
}

export function normalizeImagePathForStorage(value: string | null | undefined) {
  if (typeof value !== "string") return "";

  const normalized = normalizeImageSuffix(value);
  if (!normalized) return "";

  if (!/^https?:\/\//i.test(normalized)) {
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.host.toLowerCase();

    // Only strip project-owned domains; keep unrelated external links intact.
    if (!isProjectOwnedHost(host)) {
      return normalized;
    }

    const pathname = decodePathname(parsed.pathname || "/");
    const nextPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return `${nextPath}${parsed.search}${parsed.hash}`;
  } catch {
    return normalized;
  }
}

export function resolveImageUrl(value: string | null | undefined) {
  if (typeof value !== "string") return "";

  const normalized = normalizeImagePathForStorage(value);
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;

  return `${getCdnDomain()}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

export function normalizeHtmlImageSourcesForStorage(value: string) {
  if (!value) return value;

  return value.replace(
    /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
    (_, left: string, src: string, right: string) => {
      return `${left}${normalizeImagePathForStorage(src)}${right}`;
    },
  );
}

export function normalizeMarkdownImageSourcesForStorage(value: string) {
  if (!value) return value;

  return value.replace(
    /(!\[[^\]]*]\()([^) \t\r\n]+)(\))/gi,
    (_, left: string, src: string, right: string) => {
      return `${left}${normalizeImagePathForStorage(src)}${right}`;
    },
  );
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseImageRecords(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [] as ImageRecord[];
  }

  return splitLines(value)
    .map((url, index) => ({
      url: normalizeImagePathForStorage(url),
      sortOrder: index,
    }))
    .filter((record) => Boolean(record.url));
}

export function resolveCoverImage(
  coverImage: FormDataEntryValue | null,
  imageRecords: ImageRecord[],
) {
  if (typeof coverImage === "string" && coverImage.trim()) {
    return normalizeImagePathForStorage(coverImage);
  }

  return imageRecords[0]?.url ?? null;
}

export function sortImageRecords<
  T extends {
    sortOrder: number;
    createdAt?: Date;
    url: string;
    altText?: string | null;
  },
>(images: T[]): T[] {
  const sorted = [...images] as T[];

  return sorted.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    if (left.createdAt && right.createdAt) {
      return left.createdAt.getTime() - right.createdAt.getTime();
    }

    return left.url.localeCompare(right.url);
  });
}
