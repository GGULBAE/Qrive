import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QRIVE_HOST_ATTRIBUTE } from "../src/drive-dom";
import {
  DriveRowController,
  type PopoverAdapter,
} from "../src/row-controller";

function makeController() {
  const open = vi.fn<PopoverAdapter["open"]>();
  const controller = new DriveRowController("en", { open });
  controllers.push(controller);
  return { controller, open };
}

const controllers: DriveRowController[] = [];

function renderSharedRow(): HTMLElement {
  document.body.innerHTML = `
    <main>
      <div role="grid">
        <div role="row" data-qrive-fixture-row>
          <a data-qrive-name="Alpha.pdf"
             href="https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing">
            Alpha.pdf
          </a>
          <span aria-label="Shared"></span>
        </div>
      </div>
    </main>
  `;
  const row = document.querySelector<HTMLElement>("[role='row']");
  if (!row) {
    throw new Error("Expected a fixture row");
  }
  return row;
}

function getButton(row: HTMLElement): HTMLButtonElement {
  expect(row.querySelector(`[${QRIVE_HOST_ATTRIBUTE}]`)).toBeNull();
  const host = document.querySelector<HTMLElement>(`[${QRIVE_HOST_ATTRIBUTE}]`);
  const button = host?.shadowRoot?.querySelector<HTMLButtonElement>("button");
  if (!button) {
    throw new Error("Expected Qrive button");
  }
  return button;
}

describe("DriveRowController", () => {
  beforeEach(() => {
    document.documentElement.lang = "en";
    document.body.innerHTML = "";
  });

  afterEach(() => {
    for (const controller of controllers.splice(0)) {
      controller.destroy();
    }
  });

  it("inserts exactly one button beside a shared indicator", () => {
    const row = renderSharedRow();
    const { controller } = makeController();

    controller.process(document);
    controller.process(document);
    controller.processRow(row);

    expect(
      document.querySelectorAll(`[${QRIVE_HOST_ATTRIBUTE}]`),
    ).toHaveLength(1);
    expect(getButton(row).getAttribute("aria-label")).toBe(
      "Create a QR code for Alpha.pdf",
    );
  });

  it("refreshes name and link when a virtualized row is reused", () => {
    const row = renderSharedRow();
    const { controller, open } = makeController();
    controller.processRow(row);

    const link = row.querySelector<HTMLAnchorElement>("a");
    if (!link) {
      throw new Error("Expected a fixture link");
    }
    link.href =
      "https://drive.google.com/file/d/9ZyXwVuTsRqPoNmLk/view?usp=sharing";
    link.dataset.qriveName = "Beta.pdf";
    link.textContent = "Beta.pdf";

    controller.processRow(row);
    const button = getButton(row);
    expect(button.getAttribute("aria-label")).toBe(
      "Create a QR code for Beta.pdf",
    );

    button.click();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0]?.[0].context).toMatchObject({
      fileName: "Beta.pdf",
      link: {
        url: "https://drive.google.com/file/d/9ZyXwVuTsRqPoNmLk/view?usp=sharing",
      },
    });
  });

  it("removes the button when a recycled row is no longer shared", () => {
    const row = renderSharedRow();
    const { controller } = makeController();
    controller.processRow(row);
    row.querySelector("[aria-label='Shared']")?.remove();

    controller.processRow(row);

    expect(document.querySelector(`[${QRIVE_HOST_ATTRIBUTE}]`)).toBeNull();
  });

  it("keeps a button but passes a null link when extraction is untrusted", () => {
    const row = renderSharedRow();
    row.querySelector("a")?.setAttribute(
      "href",
      "https://drive.google.com/drive/my-drive",
    );
    const { controller, open } = makeController();
    controller.processRow(row);

    getButton(row).click();

    expect(open.mock.calls[0]?.[0].context.link).toBeNull();
  });

  it("keeps the same overlay button when Drive replaces the row contents", () => {
    const row = renderSharedRow();
    const { controller } = makeController();
    controller.processRow(row);
    const originalHost = document.querySelector(`[${QRIVE_HOST_ATTRIBUTE}]`);

    row.innerHTML = `
      <div role="gridcell">
        <a data-qrive-name="Gamma.pdf"
           href="https://drive.google.com/file/d/7GhIjKlMnOpQrStUv/view">
          Gamma.pdf
        </a>
        <span aria-label="Shared"></span>
      </div>
    `;
    controller.processRow(row);

    expect(document.querySelector(`[${QRIVE_HOST_ATTRIBUTE}]`)).toBe(
      originalHost,
    );
    expect(getButton(row).getAttribute("aria-label")).toBe(
      "Create a QR code for Gamma.pdf",
    );
  });

  it("positions the overlay beside the shared indicator", () => {
    const row = renderSharedRow();
    const indicator = row.querySelector<HTMLElement>("[aria-label='Shared']");
    if (!indicator) {
      throw new Error("Expected a shared indicator");
    }
    indicator.getBoundingClientRect = () =>
      ({
        bottom: 120,
        height: 20,
        left: 100,
        right: 120,
        top: 100,
        width: 20,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;
    row.getBoundingClientRect = () =>
      ({
        bottom: 140,
        height: 40,
        left: 0,
        right: 800,
        top: 100,
        width: 800,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;

    const { controller } = makeController();
    controller.processRow(row);

    const host = document.querySelector<HTMLElement>(
      `[${QRIVE_HOST_ATTRIBUTE}]`,
    );
    expect(host?.hidden).toBe(false);
    expect(host?.style.left).toBe("124px");
    expect(host?.style.top).toBe("96px");
  });
});
