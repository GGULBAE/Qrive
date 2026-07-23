import {
  findDriveRows,
  findSharedIndicator,
  getIndicatorInsertionTarget,
  QRIVE_HOST_ATTRIBUTE,
  readRowContext,
  type RowContext,
} from "./drive-dom";
import { getMessages, type Locale } from "./i18n";
import type { QrivePopover } from "./popover";
import { buttonStyles } from "./styles";

interface RowState {
  readonly button: HTMLButtonElement;
  readonly host: HTMLSpanElement;
  signature: string;
}

export interface PopoverAdapter {
  open(options: {
    readonly anchor: HTMLElement;
    readonly context: RowContext;
  }): Promise<void> | void;
}

export class DriveRowController {
  private readonly locale: Locale;
  private readonly messages: ReturnType<typeof getMessages>;
  private readonly popover: PopoverAdapter;
  private readonly states = new WeakMap<HTMLElement, RowState>();

  public constructor(locale: Locale, popover: QrivePopover | PopoverAdapter) {
    this.locale = locale;
    this.messages = getMessages(locale);
    this.popover = popover;
  }

  public process(root: ParentNode): void {
    for (const row of findDriveRows(root)) {
      this.processRow(row);
    }
  }

  public processRow(row: HTMLElement): void {
    const indicator = findSharedIndicator(row);
    if (!indicator) {
      this.removeFromRow(row);
      return;
    }

    const context = readRowContext(row, this.messages.genericFileName);
    let state = this.states.get(row);
    if (!state || !state.host.isConnected || !row.contains(state.host)) {
      row.querySelector<HTMLElement>(`[${QRIVE_HOST_ATTRIBUTE}]`)?.remove();
      state = this.createButton(row, context);
      const target = getIndicatorInsertionTarget(indicator);
      target.insertAdjacentElement("afterend", state.host);
      this.states.set(row, state);
    }

    if (state.signature !== context.signature) {
      this.updateButton(state.button, context);
      state.signature = context.signature;
    }
  }

  private createButton(row: HTMLElement, context: RowContext): RowState {
    const host = document.createElement("span");
    host.setAttribute(QRIVE_HOST_ATTRIBUTE, "");
    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = buttonStyles;

    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h3v3h-3v-3Zm5 0h3v5h-3v-5Zm-5 5h5v3h-5v-3Zm6 1h2v2h-2v-2Z"/>
      </svg>
    `;
    this.updateButton(button, context);
    button.addEventListener("click", () => {
      const currentContext = readRowContext(
        row,
        this.messages.genericFileName,
      );
      this.updateButton(button, currentContext);
      void this.popover.open({ anchor: button, context: currentContext });
    });

    shadow.append(style, button);
    return { button, host, signature: context.signature };
  }

  private updateButton(
    button: HTMLButtonElement,
    context: RowContext,
  ): void {
    button.setAttribute(
      "aria-label",
      this.messages.buttonLabel(context.fileName),
    );
    button.lang = this.locale;
    button.title = this.messages.buttonLabel(context.fileName);
  }

  private removeFromRow(row: HTMLElement): void {
    this.states.get(row)?.host.remove();
    this.states.delete(row);
    row.querySelector<HTMLElement>(`[${QRIVE_HOST_ATTRIBUTE}]`)?.remove();
  }
}
