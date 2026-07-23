export const buttonStyles = `
  :host {
    display: inline-flex;
    align-items: center;
    margin-inline-start: 4px;
    vertical-align: middle;
  }

  button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 50%;
    color: #444746;
    cursor: pointer;
    display: inline-flex;
    height: 28px;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 28px;
  }

  button:hover {
    background: #e9eef6;
  }

  button:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }

  svg {
    display: block;
    height: 18px;
    width: 18px;
  }
`;

export const popoverStyles = `
  :host {
    --qrive-blue: #0b57d0;
    --qrive-border: #c4c7c5;
    --qrive-ink: #1f1f1f;
    --qrive-muted: #5f6368;
    color: var(--qrive-ink);
    font-family: Roboto, Arial, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .popover {
    background: #fff;
    border: 1px solid #e0e3e7;
    border-radius: 18px;
    box-shadow:
      0 8px 24px rgba(60, 64, 67, 0.22),
      0 2px 6px rgba(60, 64, 67, 0.14);
    max-height: min(560px, calc(100vh - 24px));
    overflow: auto;
    padding: 18px;
    position: fixed;
    width: min(340px, calc(100vw - 24px));
    z-index: 2147483647;
  }

  .header {
    align-items: center;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
    margin: 0;
  }

  .close {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 50%;
    color: #444746;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 22px;
    height: 32px;
    justify-content: center;
    padding: 0;
    width: 32px;
  }

  .close:hover {
    background: #f0f4f9;
  }

  .close:focus-visible,
  .action:focus-visible {
    outline: 2px solid var(--qrive-blue);
    outline-offset: 2px;
  }

  .file-name {
    font-size: 15px;
    font-weight: 500;
    line-height: 21px;
    margin: 0 0 14px;
    overflow-wrap: anywhere;
  }

  .qr-frame {
    align-items: center;
    background:
      linear-gradient(135deg, rgba(11, 87, 208, 0.05), transparent 58%),
      #f8fafd;
    border-radius: 14px;
    display: flex;
    justify-content: center;
    margin-bottom: 14px;
    min-height: 260px;
    padding: 10px;
  }

  canvas {
    background: #fff;
    border-radius: 8px;
    display: block;
    height: 240px;
    image-rendering: pixelated;
    max-width: 100%;
    width: 240px;
  }

  .actions {
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr 1fr;
    margin-bottom: 14px;
  }

  .action {
    align-items: center;
    background: #fff;
    border: 1px solid var(--qrive-border);
    border-radius: 999px;
    color: var(--qrive-blue);
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    justify-content: center;
    min-height: 40px;
    padding: 8px 12px;
  }

  .action.primary {
    background: var(--qrive-blue);
    border-color: var(--qrive-blue);
    color: #fff;
  }

  .action:hover {
    filter: brightness(0.97);
  }

  .notice {
    color: var(--qrive-muted);
    font-size: 12px;
    line-height: 17px;
    margin: 0;
  }

  .error {
    background: #fce8e6;
    border-radius: 12px;
    color: #8c1d18;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 14px;
    padding: 12px;
  }

  .error strong {
    display: block;
    margin-bottom: 3px;
  }

  .status {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }

  [hidden] {
    display: none !important;
  }
`;
