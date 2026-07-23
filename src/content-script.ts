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
  private positionFrame: number | null = null;
  private scanFrame: number | null = null;

  public start(): void {
    this.controller.process(document);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, true);
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
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    if (this.scanFrame !== null) {
      window.cancelAnimationFrame(this.scanFrame);
    }
    if (this.positionFrame !== null) {
      window.cancelAnimationFrame(this.positionFrame);
    }
    this.controller.destroy();
    this.popover.destroy();
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

  private readonly handleViewportChange = (): void => {
    if (this.positionFrame !== null) {
      return;
    }
    this.positionFrame = window.requestAnimationFrame(() => {
      this.positionFrame = null;
      this.controller.refreshPositions();
    });
  };
}

const INSTANCE_KEY = "__qriveExtensionInstance";
const extensionWindow = window as typeof window & {
  [INSTANCE_KEY]?: QriveExtension;
};

extensionWindow[INSTANCE_KEY]?.stop();
const extension = new QriveExtension();
extensionWindow[INSTANCE_KEY] = extension;
extension.start();
