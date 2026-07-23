import QRCode from "qrcode";

import type { RowContext } from "./drive-dom";
import { getMessages, type Locale, type Messages } from "./i18n";
import { popoverStyles } from "./styles";

interface OpenOptions {
  readonly anchor: HTMLElement;
  readonly context: RowContext;
}

const POPOVER_HOST_ATTRIBUTE = "data-qrive-popover-host";

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  return element;
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, "-")
    .replace(/[.\s]+$/g, "")
    .slice(0, 100);
  return sanitized || "qrive";
}

function isFocusable(element: HTMLElement): boolean {
  return (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-hidden") !== "true" &&
    element.getClientRects().length > 0
  );
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  // The synchronous fallback is needed in content-script contexts where the
  // asynchronous Clipboard API can be unavailable despite a user gesture.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("document.execCommand('copy') returned false");
  }
}

export class QrivePopover {
  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly messages: Messages;
  private readonly copyResetTimers = new WeakMap<HTMLButtonElement, number>();
  private activeAnchor: HTMLElement | null = null;
  private popover: HTMLDivElement | null = null;

  public constructor(locale: Locale) {
    this.messages = getMessages(locale);
    this.host = createElement("div");
    this.host.setAttribute(POPOVER_HOST_ATTRIBUTE, "");
    this.shadow = this.host.attachShadow({ mode: "open" });

    const style = createElement("style");
    style.textContent = popoverStyles;
    this.shadow.append(style);
    document.documentElement.append(this.host);

    document.addEventListener("pointerdown", this.handleOutsidePointer, true);
    document.addEventListener("keydown", this.handleDocumentKeydown, true);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, true);
  }

  public async open({ anchor, context }: OpenOptions): Promise<void> {
    this.close(false);
    this.activeAnchor = anchor;

    const popover = createElement("div", "popover");
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-labelledby", "qrive-dialog-title");
    popover.tabIndex = -1;

    const header = createElement("div", "header");
    const title = createElement("h2");
    title.id = "qrive-dialog-title";
    title.textContent = this.messages.title;
    const closeButton = createElement("button", "close");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", this.messages.closeLabel);
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.close());
    header.append(title, closeButton);

    const fileName = createElement("p", "file-name");
    fileName.textContent = context.fileName;
    popover.append(header, fileName);

    const status = createElement("p", "status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    popover.append(status);

    const trustedLink = context.link;
    if (trustedLink) {
      const frame = createElement("div", "qr-frame");
      const canvas = createElement("canvas");
      canvas.setAttribute("role", "img");
      canvas.setAttribute(
        "aria-label",
        this.messages.qrAlt(context.fileName),
      );
      frame.append(canvas);
      popover.append(frame);

      const actions = createElement("div", "actions");
      const copyButton = createElement("button", "action copy-action");
      copyButton.type = "button";
      copyButton.textContent = this.messages.copy;
      copyButton.addEventListener("click", () => {
        void this.copyLink(trustedLink.url, copyButton, status);
      });

      const saveButton = createElement("button", "action primary");
      saveButton.type = "button";
      saveButton.textContent = this.messages.download;
      saveButton.addEventListener("click", () => {
        void this.saveCanvas(canvas, context.fileName, status);
      });
      actions.append(copyButton, saveButton);
      popover.append(actions);

      try {
        await QRCode.toCanvas(canvas, trustedLink.url, {
          color: { dark: "#1f1f1f", light: "#ffffff" },
          errorCorrectionLevel: "M",
          margin: 2,
          width: 240,
        });
      } catch {
        frame.remove();
        actions.remove();
        popover.append(
          this.createError(
            this.messages.errorTitle,
            this.messages.qrRenderFailed,
          ),
        );
      }
    } else {
      popover.append(
        this.createError(
          this.messages.errorTitle,
          this.messages.untrustedLink,
        ),
      );
    }

    const notice = createElement("p", "notice");
    notice.textContent = this.messages.permissionNotice;
    popover.append(notice);

    this.shadow.append(popover);
    this.popover = popover;
    this.position(anchor);
    closeButton.focus({ preventScroll: true });
  }

  public close(restoreFocus = true): void {
    this.popover?.remove();
    this.popover = null;
    const anchor = this.activeAnchor;
    this.activeAnchor = null;
    if (restoreFocus && anchor?.isConnected) {
      anchor.focus({ preventScroll: true });
    }
  }

  public destroy(): void {
    this.close(false);
    document.removeEventListener("pointerdown", this.handleOutsidePointer, true);
    document.removeEventListener("keydown", this.handleDocumentKeydown, true);
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    this.host.remove();
  }

  private readonly handleOutsidePointer = (event: PointerEvent): void => {
    if (!this.popover) {
      return;
    }

    const path = event.composedPath();
    if (path.includes(this.host) || path.includes(this.activeAnchor as EventTarget)) {
      return;
    }
    this.close();
  };

  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.popover) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = [
      ...this.popover.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ].filter(isFocusable);
    if (focusable.length === 0) {
      event.preventDefault();
      this.popover.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    const active = this.shadow.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  private readonly handleViewportChange = (): void => {
    if (this.activeAnchor) {
      this.position(this.activeAnchor);
    }
  };

  private position(anchor: HTMLElement): void {
    if (!this.popover) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = this.popover.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;

    let left = anchorRect.right - popoverRect.width;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - popoverRect.width - viewportPadding),
    );

    let top = anchorRect.bottom + gap;
    if (
      top + popoverRect.height > window.innerHeight - viewportPadding &&
      anchorRect.top - popoverRect.height - gap >= viewportPadding
    ) {
      top = anchorRect.top - popoverRect.height - gap;
    }
    top = Math.max(
      viewportPadding,
      Math.min(top, window.innerHeight - popoverRect.height - viewportPadding),
    );

    this.popover.style.left = `${String(Math.round(left))}px`;
    this.popover.style.top = `${String(Math.round(top))}px`;
  }

  private createError(title: string, message: string): HTMLDivElement {
    const error = createElement("div", "error");
    error.setAttribute("role", "alert");
    const heading = createElement("strong");
    heading.textContent = title;
    const details = createElement("span");
    details.textContent = message;
    error.append(heading, details);
    return error;
  }

  private async copyLink(
    url: string,
    button: HTMLButtonElement,
    status: HTMLElement,
  ): Promise<void> {
    try {
      await copyText(url);
      const currentTimer = this.copyResetTimers.get(button);
      if (currentTimer !== undefined) {
        window.clearTimeout(currentTimer);
      }
      button.classList.remove("copied");
      // Restart the confirmation animation when users copy repeatedly.
      void button.offsetWidth;
      button.classList.add("copied");
      button.textContent = this.messages.copied;
      status.textContent = this.messages.copied;
      const resetTimer = window.setTimeout(() => {
        if (button.isConnected) {
          button.classList.remove("copied");
          button.textContent = this.messages.copy;
        }
        this.copyResetTimers.delete(button);
      }, 1500);
      this.copyResetTimers.set(button, resetTimer);
    } catch {
      status.textContent = this.messages.copyFailed;
    }
  }

  private async saveCanvas(
    canvas: HTMLCanvasElement,
    fileName: string,
    status: HTMLElement,
  ): Promise<void> {
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Canvas serialization returned null"));
          }
        }, "image/png");
      });
      const url = URL.createObjectURL(blob);
      const download = createElement("a");
      download.href = url;
      download.download = `${sanitizeFileName(fileName)}-qrive.png`;
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      status.textContent = this.messages.downloadFailed;
    }
  }
}
