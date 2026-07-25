import { readFile } from "node:fs/promises";

const requiredVariables = [
  "CWS_ACCESS_TOKEN",
  "CWS_ITEM_ID",
  "CWS_PUBLISHER_ID",
  "CWS_ZIP_PATH",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const accessToken = process.env.CWS_ACCESS_TOKEN;
const itemId = process.env.CWS_ITEM_ID;
const publisherId = process.env.CWS_PUBLISHER_ID;
const zipPath = process.env.CWS_ZIP_PATH;
const itemName = `publishers/${publisherId}/items/${itemId}`;
const apiBase = "https://chromewebstore.googleapis.com";

async function apiRequest(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { rawResponse: text };
    }
  }

  if (!response.ok) {
    throw new Error(
      `Chrome Web Store API returned ${String(response.status)}: ${JSON.stringify(payload)}`,
    );
  }
  return payload;
}

const upload = await apiRequest(
  `${apiBase}/upload/v2/${itemName}:upload`,
  {
    body: await readFile(zipPath),
    headers: { "Content-Type": "application/zip" },
    method: "POST",
  },
);

let uploadState = upload.uploadState;
for (let attempt = 1; uploadState === "IN_PROGRESS" && attempt <= 12; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const status = await apiRequest(
    `${apiBase}/v2/${itemName}:fetchStatus`,
    { method: "GET" },
  );
  uploadState = status.lastAsyncUploadState;
}

if (uploadState !== "SUCCEEDED") {
  throw new Error(`Chrome Web Store upload did not succeed: ${String(uploadState)}`);
}

const publication = await apiRequest(
  `${apiBase}/v2/${itemName}:publish`,
  {
    body: JSON.stringify({
      blockOnWarnings: true,
      publishType: "DEFAULT_PUBLISH",
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  },
);

console.log(
  JSON.stringify(
    {
      itemId: publication.itemId ?? itemId,
      state: publication.state,
      uploadState,
    },
    null,
    2,
  ),
);
