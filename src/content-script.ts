import { detectLocale } from "./i18n";
import {
  mutationsOnlyAddQriveHosts,
  mutationsRemoveQriveHost,
} from "./mutations";
import { QrivePopover } from "./popover";
import { DriveRowController } from "./row-controller";

class QriveExtension {
  private readonly popover = new QrivePopover(detectLocale());
  private readonly controller = new DriveRowController(
    detectLocale(),
    this.popover,
  );
  private readonly observer = new MutationObserver((records) => {
    if (mutationsRemoveQriveHost(records)) {
      // Drive replaces row contents during hover and selection. Restore a
      // removed button in the mutation microtask so it is present before paint.
      this.controller.process(document);
      return;
    }

    if (!mutationsOnlyAddQriveHosts(records)) {
      this.scheduleScan();
    }
  });
  private scanFrame: number | null = null;

  public start(): void {
    if (!document.body) {
      document.addEventListener(
        "DOMContentLoaded",
        this.handleDocumentReady,
        { once: true },
      );
      return;
    }

    this.observeDrive();
  }

  public stop(): void {
    document.removeEventListener(
      "DOMContentLoaded",
      this.handleDocumentReady,
    );
    this.observer.disconnect();
    if (this.scanFrame !== null) {
      window.cancelAnimationFrame(this.scanFrame);
    }
    this.controller.destroy();
    this.popover.destroy();
  }

  private readonly handleDocumentReady = (): void => {
    this.observeDrive();
  };

  private observeDrive(): void {
    const body = document.body;
    if (!body) {
      return;
    }

    this.controller.process(document);
    this.observer.observe(body, {
      attributeFilter: [
        "aria-label",
        "data-href",
        "data-id",
        "data-item-id",
        "data-drive-id",
        "data-tooltip",
        "data-tooltip-text",
        "data-url",
        "href",
        "role",
        "title",
      ],
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  private scheduleScan(): void {
    if (this.scanFrame !== null) {
      return;
    }
    this.scanFrame = window.requestAnimationFrame(() => {
      this.scanFrame = null;
      this.controller.process(document);
    });
  }
}

const INSTANCE_KEY = "__qriveExtensionInstance";
const extensionWindow = window as typeof window & {
  [INSTANCE_KEY]?: QriveExtension;
};

extensionWindow[INSTANCE_KEY]?.stop();
const extension = new QriveExtension();
extensionWindow[INSTANCE_KEY] = extension;
extension.start();
