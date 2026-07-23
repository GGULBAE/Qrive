import {
  findDriveRows,
  findSharedIndicator,
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
  readonly row: HTMLElement;
  indicator: HTMLElement;
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
  private readonly activeStates = new Set<RowState>();

  public constructor(locale: Locale, popover: QrivePopover | PopoverAdapter) {
    this.locale = locale;
    this.messages = getMessages(locale);
    this.popover = popover;
  }

  public process(root: ParentNode): void {
    for (const row of findDriveRows(root)) {
      this.processRow(row);
    }
    this.removeDisconnectedStates();
  }

  public processRow(row: HTMLElement): void {
    const indicator = findSharedIndicator(row);
    if (!indicator) {
      this.removeFromRow(row);
      return;
    }

    const context = readRowContext(row, this.messages.genericFileName);
    let state = this.states.get(row);
    if (!state || !state.host.isConnected) {
      if (state) {
        this.activeStates.delete(state);
      }
      state = this.createButton(row, indicator, context);
      this.states.set(row, state);
    }

    state.indicator = indicator;
    if (state.signature !== context.signature) {
      this.updateButton(state.button, context);
      state.signature = context.signature;
    }
    this.positionButton(state);
  }

  public refreshPositions(): void {
    for (const state of this.activeStates) {
      this.positionButton(state);
    }
  }

  public destroy(): void {
    for (const state of this.activeStates) {
      state.host.remove();
      this.states.delete(state.row);
    }
    this.activeStates.clear();
  }

  private createButton(
    row: HTMLElement,
    indicator: HTMLElement,
    context: RowContext,
  ): RowState {
    const host = document.createElement("span");
    host.setAttribute(QRIVE_HOST_ATTRIBUTE, "");
    host.style.height = "28px";
    host.style.margin = "0";
    host.style.padding = "0";
    host.style.pointerEvents = "auto";
    host.style.position = "fixed";
    host.style.width = "28px";
    host.style.zIndex = "2147483646";
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
    document.documentElement.append(host);

    const state = {
      button,
      host,
      indicator,
      row,
      signature: context.signature,
    };
    this.activeStates.add(state);
    return state;
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
    const state = this.states.get(row);
    state?.host.remove();
    if (state) {
      this.activeStates.delete(state);
    }
    this.states.delete(row);
  }

  private removeDisconnectedStates(): void {
    for (const state of this.activeStates) {
      if (!state.row.isConnected) {
        this.removeFromRow(state.row);
      }
    }
  }

  private positionButton(state: RowState): void {
    if (!state.row.isConnected || !state.indicator.isConnected) {
      state.host.hidden = true;
      return;
    }

    const indicatorRect = state.indicator.getBoundingClientRect();
    const rowRect = state.row.getBoundingClientRect();
    const buttonSize = 28;
    const gap = 4;
    const isVisible =
      indicatorRect.width > 0 &&
      indicatorRect.height > 0 &&
      rowRect.width > 0 &&
      rowRect.height > 0 &&
      indicatorRect.bottom >= 0 &&
      indicatorRect.top <= window.innerHeight &&
      indicatorRect.right >= 0 &&
      indicatorRect.left <= window.innerWidth;

    state.host.hidden = !isVisible;
    if (!isVisible) {
      return;
    }

    const left = indicatorRect.right + gap;
    const top = indicatorRect.top + (indicatorRect.height - buttonSize) / 2;
    state.host.style.left = `${String(Math.round(left))}px`;
    state.host.style.top = `${String(Math.round(top))}px`;
  }
}
