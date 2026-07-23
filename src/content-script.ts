import { detectLocale } from "./i18n";
import { QrivePopover } from "./popover";
import { DriveRowController } from "./row-controller";

class QriveExtension {
  private readonly popover = new QrivePopover(detectLocale());
  private readonly controller = new DriveRowController(
    detectLocale(),
    this.popover,
  );
  private readonly observer = new MutationObserver(() => this.scheduleScan());
  private scanPending = false;

  public start(): void {
    this.controller.process(document);
    this.observer.observe(document.body, {
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

  public stop(): void {
    this.observer.disconnect();
    this.popover.destroy();
  }

  private scheduleScan(): void {
    if (this.scanPending) {
      return;
    }
    this.scanPending = true;
    window.requestAnimationFrame(() => {
      this.scanPending = false;
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
