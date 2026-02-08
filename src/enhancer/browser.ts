import { exec } from 'node:child_process';
import { platform } from 'node:os';

import { logger } from '../utils/logger.js';

function execCommand(command: string): void {
  exec(command, (err) => {
    if (err) {
      logger.warn({ error: err.message, command }, '浏览器自动打开失败');
    }
  });
}

export function openBrowser(url: string): void {
  const os = platform();

  if (os === 'darwin') {
    execCommand(`open "${url}"`);
    return;
  }

  if (os === 'win32') {
    // start is a shell built-in
    execCommand(`cmd /c start "" "${url}"`);
    return;
  }

  execCommand(`xdg-open "${url}"`);
}

