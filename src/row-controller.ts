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

const BUTTON_GAP = 4;
const BUTTON_SIZE = 20;
const RUNTIME_REVISION = "portal-button-v8";

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
  private readonly statesByHost = new WeakMap<HTMLSpanElement, RowState>();
  private readonly activeStates = new Set<RowState>();
  private positionFrame: number | null = null;

  public constructor(locale: Locale, popover: QrivePopover | PopoverAdapter) {
    this.locale = locale;
    this.messages = getMessages(locale);
    this.popover = popover;
    window.addEventListener("pointerdown", this.handlePortalEvent, true);
    window.addEventListener("mousedown", this.handlePortalEvent, true);
    window.addEventListener("pointerup", this.handlePortalEvent, true);
    window.addEventListener("mouseup", this.handlePortalEvent, true);
    window.addEventListener("click", this.handlePortalEvent, true);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, true);
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
    if (!state) {
      state = this.createButton(row, indicator, context);
      this.states.set(row, state);
    }

    state.indicator = indicator;
    if (state.signature !== context.signature) {
      this.updateButton(state.button, context);
      state.signature = context.signature;
    }
    this.mountButton(state);
  }

  public destroy(): void {
    window.removeEventListener("pointerdown", this.handlePortalEvent, true);
    window.removeEventListener("mousedown", this.handlePortalEvent, true);
    window.removeEventListener("pointerup", this.handlePortalEvent, true);
    window.removeEventListener("mouseup", this.handlePortalEvent, true);
    window.removeEventListener("click", this.handlePortalEvent, true);
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    if (this.positionFrame !== null) {
      window.cancelAnimationFrame(this.positionFrame);
    }
    for (const state of this.activeStates) {
      state.host.remove();
      this.states.delete(state.row);
      this.statesByHost.delete(state.host);
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
    host.setAttribute("data-qrive-runtime", RUNTIME_REVISION);
    host.style.height = `${BUTTON_SIZE}px`;
    host.style.pointerEvents = "auto";
    host.style.position = "fixed";
    host.style.width = `${BUTTON_SIZE}px`;
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
    shadow.append(style, button);

    const state: RowState = {
      button,
      host,
      indicator,
      row,
      signature: context.signature,
    };
    this.statesByHost.set(host, state);
    this.activeStates.add(state);
    this.mountButton(state);
    return state;
  }

  private readonly handlePortalEvent = (event: Event): void => {
    const host = event.composedPath().find(
      (target): target is HTMLSpanElement =>
        target instanceof HTMLSpanElement &&
        target.hasAttribute(QRIVE_HOST_ATTRIBUTE),
    );
    const state = host ? this.statesByHost.get(host) : undefined;
    if (!state) {
      return;
    }

    event.stopImmediatePropagation();
    if (event.cancelable) {
      event.preventDefault();
    }
    if (event.type !== "click") {
      return;
    }

    const currentContext = readRowContext(
      state.row,
      this.messages.genericFileName,
    );
    this.updateButton(state.button, currentContext);
    state.button.focus({ preventScroll: true });
    void this.popover.open({
      anchor: state.button,
      context: currentContext,
    });
  };

  private readonly handleViewportChange = (): void => {
    if (this.positionFrame !== null) {
      return;
    }
    this.positionFrame = window.requestAnimationFrame(() => {
      this.positionFrame = null;
      for (const state of this.activeStates) {
        this.positionButton(state);
      }
    });
  };

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
      this.statesByHost.delete(state.host);
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

  private mountButton(state: RowState): void {
    if (!state.row.isConnected || !state.indicator.isConnected) {
      state.host.hidden = true;
      return;
    }

    if (!state.host.isConnected) {
      document.documentElement.append(state.host);
    }
    this.positionButton(state);
  }

  private positionButton(state: RowState): void {
    const rect = state.indicator.getBoundingClientRect();
    const isVisible =
      state.row.isConnected &&
      state.indicator.isConnected &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;

    state.host.hidden = !isVisible;
    if (!isVisible) {
      return;
    }

    state.host.style.left = `${Math.round(rect.right + BUTTON_GAP)}px`;
    state.host.style.top = `${Math.round(
      rect.top + (rect.height - BUTTON_SIZE) / 2,
    )}px`;
  }
}
