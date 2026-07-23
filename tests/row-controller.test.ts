import { beforeEach, describe, expect, it, vi } from "vitest";

import { QRIVE_HOST_ATTRIBUTE } from "../src/drive-dom";
import {
  DriveRowController,
  type PopoverAdapter,
} from "../src/row-controller";

function makeController() {
  const open = vi.fn<PopoverAdapter["open"]>();
  const controller = new DriveRowController("en", { open });
  return { controller, open };
}

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
  const host = row.querySelector<HTMLElement>(`[${QRIVE_HOST_ATTRIBUTE}]`);
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

  it("inserts exactly one button beside a shared indicator", () => {
    const row = renderSharedRow();
    const { controller } = makeController();

    controller.process(document);
    controller.process(document);
    controller.processRow(row);

    expect(
      row.querySelectorAll(`[${QRIVE_HOST_ATTRIBUTE}]`),
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

    expect(row.querySelector(`[${QRIVE_HOST_ATTRIBUTE}]`)).toBeNull();
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
});
