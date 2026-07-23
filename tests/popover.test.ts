import { afterEach, describe, expect, it } from "vitest";

import type { RowContext } from "../src/drive-dom";
import { QrivePopover } from "../src/popover";

const untrustedContext: RowContext = {
  fileName: "계획서.pdf",
  link: null,
  signature: "계획서.pdf\u0000untrusted",
};

const popovers: QrivePopover[] = [];

afterEach(() => {
  for (const popover of popovers.splice(0)) {
    popover.destroy();
  }
  document.body.innerHTML = "";
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
});
