import { describe, expect, it } from "vitest";

import { QRIVE_HOST_ATTRIBUTE } from "../src/drive-dom";
import {
  mutationsOnlyAddQriveHosts,
  mutationsRemoveQriveHost,
} from "../src/mutations";

function childListRecord({
  added = [],
  removed = [],
}: {
  added?: Node[];
  removed?: Node[];
}): MutationRecord {
  return {
    addedNodes: added as unknown as NodeList,
    removedNodes: removed as unknown as NodeList,
    type: "childList",
  } as MutationRecord;
}

function qriveHost(): HTMLElement {
  const host = document.createElement("span");
  host.setAttribute(QRIVE_HOST_ATTRIBUTE, "");
  return host;
}

describe("Qrive mutation detection", () => {
  it("detects a removed button nested inside replaced Drive row content", () => {
    const replacedContent = document.createElement("div");
    replacedContent.append(qriveHost());

    expect(
      mutationsRemoveQriveHost([
        childListRecord({ removed: [replacedContent] }),
      ]),
    ).toBe(true);
  });

  it("ignores the follow-up mutation caused only by restoring buttons", () => {
    expect(
      mutationsOnlyAddQriveHosts([
        childListRecord({ added: [qriveHost(), qriveHost()] }),
      ]),
    ).toBe(true);
  });

  it("keeps normal Drive mutations eligible for a scheduled scan", () => {
    expect(
      mutationsOnlyAddQriveHosts([
        childListRecord({ added: [document.createElement("div")] }),
      ]),
    ).toBe(false);
  });
});
