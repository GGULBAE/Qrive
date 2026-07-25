import { QRIVE_HOST_ATTRIBUTE } from "./drive-dom";

function isQriveHost(node: Node): node is Element {
  return (
    node instanceof Element && node.hasAttribute(QRIVE_HOST_ATTRIBUTE)
  );
}

function containsQriveHost(node: Node): boolean {
  return (
    isQriveHost(node) ||
    (node instanceof Element &&
      node.querySelector(`[${QRIVE_HOST_ATTRIBUTE}]`) !== null)
  );
}

export function mutationsRemoveQriveHost(
  records: readonly MutationRecord[],
): boolean {
  return records.some(
    (record) =>
      record.type === "childList" &&
      [...record.removedNodes].some(containsQriveHost),
  );
}

export function mutationsOnlyAddQriveHosts(
  records: readonly MutationRecord[],
): boolean {
  return (
    records.length > 0 &&
    records.every(
      (record) =>
        record.type === "childList" &&
        record.removedNodes.length === 0 &&
        record.addedNodes.length > 0 &&
        [...record.addedNodes].every(isQriveHost),
    )
  );
}
