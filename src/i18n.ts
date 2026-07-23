export type Locale = "en" | "ko";

const messages = {
  en: {
    buttonLabel: (name: string) => `Create a QR code for ${name}`,
    closeLabel: "Close QR code dialog",
    copy: "Copy link",
    copied: "Copied",
    copyFailed: "Could not copy the link.",
    download: "Save PNG",
    downloadFailed: "Could not save the QR code.",
    errorTitle: "A QR code could not be created",
    genericFileName: "shared item",
    permissionNotice:
      "Existing sharing permissions in Google Drive still apply.",
    qrAlt: (name: string) => `QR code for ${name}`,
    qrRenderFailed: "The QR code could not be rendered.",
    title: "QR link",
    untrustedLink:
      "Qrive could not find a trusted Google Drive sharing link for this row. No QR code was created.",
  },
  ko: {
    buttonLabel: (name: string) => `${name}의 QR 코드 만들기`,
    closeLabel: "QR 코드 대화상자 닫기",
    copy: "링크 복사",
    copied: "복사됨",
    copyFailed: "링크를 복사하지 못했습니다.",
    download: "PNG 저장",
    downloadFailed: "QR 코드를 저장하지 못했습니다.",
    errorTitle: "QR 코드를 만들 수 없습니다",
    genericFileName: "공유 항목",
    permissionNotice: "Google Drive의 기존 공유 권한이 그대로 적용됩니다.",
    qrAlt: (name: string) => `${name}의 QR 코드`,
    qrRenderFailed: "QR 코드를 렌더링하지 못했습니다.",
    title: "QR 링크",
    untrustedLink:
      "이 행에서 신뢰할 수 있는 Google Drive 공유 링크를 찾지 못했습니다. QR 코드를 만들지 않았습니다.",
  },
} as const;

export type Messages = (typeof messages)[Locale];

export function detectLocale(language = document.documentElement.lang): Locale {
  return language.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
