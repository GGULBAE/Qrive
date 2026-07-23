import { describe, expect, it } from "vitest";

import {
  extractTrustedDriveLink,
  findDriveRows,
  findSharedIndicator,
  isSharedRow,
  isTrustedDriveUrl,
  readRowContext,
} from "../src/drive-dom";

function fixture(markup: string): HTMLElement {
  document.body.innerHTML = markup;
  const row = document.querySelector<HTMLElement>("[data-qrive-fixture-row]");
  if (!row) {
    throw new Error("Fixture is missing a row");
  }
  return row;
}

describe("Google Drive row detection", () => {
  it("detects English and Korean shared indicators", () => {
    const english = fixture(`
      <div data-qrive-fixture-row>
        <span aria-label="Shared"></span>
      </div>
    `);
    expect(isSharedRow(english)).toBe(true);

    const korean = fixture(`
      <div data-qrive-fixture-row>
        <span data-tooltip="공유됨"></span>
      </div>
    `);
    expect(findSharedIndicator(korean)).not.toBeNull();
  });

  it("does not mistake a sharing action for an existing shared indicator", () => {
    const row = fixture(`
      <div data-qrive-fixture-row>
        <button aria-label="Share">Share</button>
        <button aria-label="공유">공유</button>
      </div>
    `);
    expect(isSharedRow(row)).toBe(false);
  });

  it("finds fixture and representative Drive grid rows without duplicates", () => {
    document.body.innerHTML = `
      <main>
        <div role="grid">
          <div role="row" data-qrive-fixture-row></div>
        </div>
      </main>
    `;
    expect(findDriveRows(document)).toHaveLength(1);
  });

  it("finds the role-based main region used by the current Drive list", () => {
    document.body.innerHTML = `
      <div role="main">
        <div role="grid">
          <div role="row"></div>
        </div>
      </div>
    `;
    expect(findDriveRows(document)).toHaveLength(1);
  });
});

describe("trusted link extraction", () => {
  it("uses an existing Drive file link and preserves its URL", () => {
    const row = fixture(`
      <div data-qrive-fixture-row>
        <a href="https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing">Roadmap.pdf</a>
      </div>
    `);
    expect(extractTrustedDriveLink(row)).toEqual({
      source: "href",
      url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing",
    });
  });

  it("accepts Google Docs editor links and rejects deceptive or generic URLs", () => {
    expect(
      isTrustedDriveUrl(
        new URL(
          "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOp/edit",
        ),
      ),
    ).toBe(true);
    expect(
      isTrustedDriveUrl(
        new URL(
          "https://drive.google.com.evil.example/file/d/1AbCdEfGhIjKlMnOp/view",
        ),
      ),
    ).toBe(false);
    expect(isTrustedDriveUrl(new URL("https://drive.google.com/drive/my-drive"))).toBe(
      false,
    );
  });

  it("derives a canonical open URL only from an explicit stable item id", () => {
    const row = fixture(`
      <div data-qrive-fixture-row data-id="1AbCdEfGhIjKlMnOp">
        <span data-qrive-name="Quarterly plan"></span>
      </div>
    `);
    expect(extractTrustedDriveLink(row)).toEqual({
      source: "item-id",
      url: "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp",
    });
  });

  it("returns null instead of guessing when no trusted link is present", () => {
    const row = fixture(`
      <div data-qrive-fixture-row data-id="42">
        <a href="https://drive.google.com/drive/my-drive">My Drive</a>
      </div>
    `);
    expect(extractTrustedDriveLink(row)).toBeNull();
  });

  it("returns a file name and link signature for row reuse checks", () => {
    const row = fixture(`
      <div data-qrive-fixture-row>
        <a href="https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view">Alpha.pdf</a>
      </div>
    `);
    expect(readRowContext(row).signature).toContain("Alpha.pdf");
  });

  it("reads the emphasized name from a current Drive-style grid cell", () => {
    const row = fixture(`
      <table>
        <tbody>
          <tr role="row" data-qrive-fixture-row data-id="1AbCdEfGhIjKlMnOp">
            <td aria-label="logo2.png image shared">
              <div><strong>logo2.png</strong><span aria-label="Shared"></span></div>
            </td>
            <td>
              <div data-name="Owner name"></div>
            </td>
          </tr>
        </tbody>
      </table>
    `);
    expect(readRowContext(row).fileName).toBe("logo2.png");
  });
});
