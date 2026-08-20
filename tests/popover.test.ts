import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RowContext } from "../src/drive-dom";
import { QrivePopover } from "../src/popover";

const { toCanvas } = vi.hoisted(() => ({
  toCanvas: vi.fn(),
}));

vi.mock("qrcode", () => ({
  default: {
    toCanvas,
  },
}));

const untrustedContext: RowContext = {
  fileName: "계획서.pdf",
  link: null,
  signature: "계획서.pdf\u0000untrusted",
};

const trustedContext: RowContext = {
  fileName: "plan.pdf",
  link: {
    source: "href",
    url: "https://drive.google.com/file/d/1TrustedDriveItem/view",
  },
  signature:
    "plan.pdf\u0000https://drive.google.com/file/d/1TrustedDriveItem/view",
};

const popovers: QrivePopover[] = [];

beforeEach(() => {
  toCanvas.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const popover of popovers.splice(0)) {
    popover.destroy();
  }
  document.body.innerHTML = "";
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
});

describe("QrivePopover accessibility", () => {
  it("shows a localized error instead of creating an untrusted QR code", async () => {
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const popover = new QrivePopover("ko");
    popovers.push(popover);

    await popover.open({ anchor, context: untrustedContext });

    const host = document.querySelector<HTMLElement>(
      "[data-qrive-popover-host]",
    );
    const shadow = host?.shadowRoot;
    expect(shadow?.querySelector("[role='dialog']")).not.toBeNull();
    expect(shadow?.querySelector("canvas")).toBeNull();
    expect(shadow?.querySelector("[role='alert']")?.textContent).toContain(
      "신뢰할 수 있는 Google Drive 공유 링크",
    );
    expect(shadow?.querySelector(".notice")?.textContent).toBe(
      "Google Drive의 기존 공유 권한이 그대로 적용됩니다.",
    );
    expect(shadow?.activeElement?.getAttribute("aria-label")).toBe(
      "QR 코드 대화상자 닫기",
    );
  });

  it("closes on Escape and restores focus to the invoking button", async () => {
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const popover = new QrivePopover("en");
    popovers.push(popover);
    await popover.open({ anchor, context: untrustedContext });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
    );

    const host = document.querySelector<HTMLElement>(
      "[data-qrive-popover-host]",
    );
    expect(host?.shadowRoot?.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(anchor);
  });

  it("closes when a pointer event occurs outside the popover", async () => {
    const anchor = document.createElement("button");
    const outside = document.createElement("div");
    document.body.append(anchor, outside);
    const popover = new QrivePopover("en");
    popovers.push(popover);
    await popover.open({ anchor, context: untrustedContext });

    outside.dispatchEvent(
      new Event("pointerdown", { bubbles: true, composed: true }),
    );

    const host = document.querySelector<HTMLElement>(
      "[data-qrive-popover-host]",
    );
    expect(host?.shadowRoot?.querySelector("[role='dialog']")).toBeNull();
  });

  it("does not bubble popover interactions to Google Drive", async () => {
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const documentPointerDown = vi.fn();
    const documentMouseDown = vi.fn();
    const documentClick = vi.fn();
    document.addEventListener("pointerdown", documentPointerDown);
    document.addEventListener("mousedown", documentMouseDown);
    document.addEventListener("click", documentClick);
    const popover = new QrivePopover("en");
    popovers.push(popover);
    await popover.open({ anchor, context: untrustedContext });

    const host = document.querySelector<HTMLElement>(
      "[data-qrive-popover-host]",
    );
    const closeButton =
      host?.shadowRoot?.querySelector<HTMLButtonElement>(".close");
    closeButton?.dispatchEvent(
      new Event("pointerdown", { bubbles: true, composed: true }),
    );
    closeButton?.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, composed: true }),
    );
    closeButton?.click();
    document.removeEventListener("pointerdown", documentPointerDown);
    document.removeEventListener("mousedown", documentMouseDown);
    document.removeEventListener("click", documentClick);

    expect(documentPointerDown).not.toHaveBeenCalled();
    expect(documentMouseDown).not.toHaveBeenCalled();
    expect(documentClick).not.toHaveBeenCalled();
    expect(host?.shadowRoot?.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(anchor);
  });

  it("opens immediately and ignores an older QR render after reopening", async () => {
    const resolvers: Array<() => void> = [];
    toCanvas.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const popover = new QrivePopover("en");
    popovers.push(popover);

    const firstOpen = popover.open({ anchor, context: trustedContext });
    const host = document.querySelector<HTMLElement>(
      "[data-qrive-popover-host]",
    );
    expect(host?.shadowRoot?.querySelector("[role='dialog']")).not.toBeNull();

    host?.shadowRoot
      ?.querySelector<HTMLButtonElement>(".close")
      ?.click();
    const secondContext = {
      ...trustedContext,
      fileName: "second.pdf",
      signature: `second.pdf\u0000${trustedContext.link?.url ?? "untrusted"}`,
    };
    const secondOpen = popover.open({ anchor, context: secondContext });

    expect(
      host?.shadowRoot?.querySelectorAll("[role='dialog']"),
    ).toHaveLength(1);
    expect(host?.shadowRoot?.querySelector(".file-name")?.textContent).toBe(
      "second.pdf",
    );

    resolvers[0]?.();
    await firstOpen;
    expect(host?.shadowRoot?.querySelector(".file-name")?.textContent).toBe(
      "second.pdf",
    );

    resolvers[1]?.();
    await secondOpen;
  });

  it("animates a clear confirmation after copying a trusted link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const popover = new QrivePopover("en");
    popovers.push(popover);
    await popover.open({ anchor, context: trustedContext });

    const host = document.querySelector<HTMLElement>(
      "[data-qrive-popover-host]",
    );
    const copyButton =
      host?.shadowRoot?.querySelector<HTMLButtonElement>(".copy-action");
    copyButton?.click();

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(trustedContext.link?.url);
      expect(copyButton?.textContent).toBe("Copied");
      expect(copyButton?.classList.contains("copied")).toBe(true);
    });
    expect(
      host?.shadowRoot?.querySelector("[role='status']")?.textContent,
    ).toBe("Copied");
  });
});
