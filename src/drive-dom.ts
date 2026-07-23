export const QRIVE_HOST_ATTRIBUTE = "data-qrive-button-host";

const ROW_SELECTOR = [
  "main [role='grid'] [role='row']",
  "[role='main'] [role='grid'] [role='row']",
  "main [role='treegrid'] [role='row']",
  "[role='main'] [role='treegrid'] [role='row']",
  "main [role='listbox'] [role='option']",
  "[role='main'] [role='listbox'] [role='option']",
  "tr[data-id]",
  "[data-qrive-fixture-row]",
].join(",");

const SHARED_TEXT_PATTERNS = [
  /^shared$/i,
  /^shared with\b/i,
  /^shared item$/i,
  /^공유됨$/,
  /^공유된 항목$/,
  /^공유 사용자\b/,
] as const;

const TRUSTED_PATH_PATTERNS = {
  "docs.google.com": [
    /^\/document\/d\/[A-Za-z0-9_-]{10,}(?:\/|$)/,
    /^\/spreadsheets\/d\/[A-Za-z0-9_-]{10,}(?:\/|$)/,
    /^\/presentation\/d\/[A-Za-z0-9_-]{10,}(?:\/|$)/,
    /^\/forms\/d\/[A-Za-z0-9_-]{10,}(?:\/|$)/,
  ],
  "drive.google.com": [
    /^\/file\/d\/[A-Za-z0-9_-]{10,}(?:\/|$)/,
    /^\/drive\/(?:u\/\d+\/)?folders\/[A-Za-z0-9_-]{10,}(?:\/|$)/,
  ],
} as const;

const ITEM_ID_ATTRIBUTES = [
  "data-drive-id",
  "data-item-id",
  "data-id",
] as const;

export interface TrustedDriveLink {
  readonly source: "href" | "item-id";
  readonly url: string;
}

export interface RowContext {
  readonly fileName: string;
  readonly link: TrustedDriveLink | null;
  readonly signature: string;
}

function normalizeText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function isSharedText(value: string): boolean {
  return SHARED_TEXT_PATTERNS.some((pattern) => pattern.test(value));
}

export function isTrustedDriveUrl(url: URL): boolean {
  if (url.protocol !== "https:") {
    return false;
  }

  const host = url.hostname.toLowerCase();
  const patterns =
    TRUSTED_PATH_PATTERNS[host as keyof typeof TRUSTED_PATH_PATTERNS];

  if (patterns?.some((pattern) => pattern.test(url.pathname))) {
    return true;
  }

  if (host !== "drive.google.com" || url.pathname !== "/open") {
    return false;
  }

  return isTrustedItemId(url.searchParams.get("id"));
}

function toTrustedUrl(
  rawUrl: string,
  baseUrl = "https://drive.google.com/",
): string | null {
  try {
    const url = new URL(rawUrl, baseUrl);
    return isTrustedDriveUrl(url) ? url.href : null;
  } catch {
    return null;
  }
}

function isTrustedItemId(value: string | null): value is string {
  if (value === null || !/^[A-Za-z0-9_-]{10,}$/.test(value)) {
    return false;
  }

  return /[A-Za-z_-]/.test(value);
}

function isQriveElement(element: Element): boolean {
  return element.closest(`[${QRIVE_HOST_ATTRIBUTE}]`) !== null;
}

export function findSharedIndicator(row: HTMLElement): HTMLElement | null {
  const candidates = row.querySelectorAll<HTMLElement>(
    "[aria-label], [data-tooltip], [data-tooltip-text], [title]",
  );

  for (const candidate of candidates) {
    if (isQriveElement(candidate)) {
      continue;
    }

    const labels = [
      candidate.getAttribute("aria-label"),
      candidate.getAttribute("data-tooltip"),
      candidate.getAttribute("data-tooltip-text"),
      candidate.getAttribute("title"),
    ];

    if (labels.some((label) => isSharedText(normalizeText(label)))) {
      return candidate;
    }
  }

  return null;
}

export function isSharedRow(row: HTMLElement): boolean {
  return findSharedIndicator(row) !== null;
}

export function extractTrustedDriveLink(
  row: HTMLElement,
  baseUrl = "https://drive.google.com/",
): TrustedDriveLink | null {
  const urlElements = row.querySelectorAll<HTMLElement>(
    "a[href], [data-href], [data-url]",
  );

  for (const element of urlElements) {
    if (isQriveElement(element)) {
      continue;
    }

    const rawCandidates = [
      element instanceof HTMLAnchorElement ? element.href : null,
      element.getAttribute("data-href"),
      element.getAttribute("data-url"),
    ];

    for (const rawUrl of rawCandidates) {
      if (!rawUrl) {
        continue;
      }

      const url = toTrustedUrl(rawUrl, baseUrl);
      if (url) {
        return { source: "href", url };
      }
    }
  }

  for (const attribute of ITEM_ID_ATTRIBUTES) {
    const itemId = row.getAttribute(attribute);
    if (isTrustedItemId(itemId)) {
      const url = new URL("https://drive.google.com/open");
      url.searchParams.set("id", itemId);
      return { source: "item-id", url: url.href };
    }
  }

  return null;
}

function findFileName(row: HTMLElement, link: TrustedDriveLink | null): string {
  const explicitName = row.querySelector<HTMLElement>("[data-qrive-name]");
  const explicitValue = normalizeText(
    explicitName?.getAttribute("data-qrive-name") ?? explicitName?.textContent,
  );
  if (explicitValue) {
    return explicitValue;
  }

  const firstGridCell = row.querySelector<HTMLElement>(
    "td, [role='gridcell']",
  );
  const emphasizedName = normalizeText(
    firstGridCell?.querySelector<HTMLElement>("strong")?.textContent,
  );
  if (emphasizedName) {
    return emphasizedName;
  }

  const gridCellName = firstGridCell?.querySelector<HTMLElement>("[data-name]");
  const gridCellNameValue = normalizeText(
    gridCellName?.getAttribute("data-name") ?? gridCellName?.textContent,
  );
  if (gridCellNameValue) {
    return gridCellNameValue;
  }

  if (link) {
    const matchingLink = [...row.querySelectorAll<HTMLAnchorElement>("a[href]")]
      .find((anchor) => toTrustedUrl(anchor.href) === link.url);
    const linkName = normalizeText(
      matchingLink?.textContent ?? matchingLink?.getAttribute("aria-label"),
    );
    if (linkName && !isSharedText(linkName)) {
      return linkName;
    }
  }

  const cells = row.querySelectorAll<HTMLElement>(
    "td [aria-label], td [data-tooltip], td [title], [role='gridcell'] [aria-label], [role='gridcell'] [data-tooltip], [role='gridcell'] [title]",
  );
  for (const cell of cells) {
    const label = normalizeText(
      cell.getAttribute("aria-label") ??
        cell.getAttribute("data-tooltip") ??
        cell.getAttribute("title"),
    );
    if (label && !isSharedText(label)) {
      return label;
    }
  }

  const rowLabel = normalizeText(row.getAttribute("aria-label"));
  return rowLabel && !isSharedText(rowLabel) ? rowLabel : "";
}

export function readRowContext(
  row: HTMLElement,
  genericFileName = "shared item",
): RowContext {
  const link = extractTrustedDriveLink(row);
  const fileName = findFileName(row, link) || genericFileName;
  const signature = `${fileName}\u0000${link?.url ?? "untrusted"}`;

  return { fileName, link, signature };
}

export function findDriveRows(root: ParentNode): HTMLElement[] {
  const rows = new Set<HTMLElement>();
  if (root instanceof HTMLElement && root.matches(ROW_SELECTOR)) {
    rows.add(root);
  }
  root.querySelectorAll<HTMLElement>(ROW_SELECTOR).forEach((row) => rows.add(row));
  return [...rows];
}
