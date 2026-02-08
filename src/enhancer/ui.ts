export function getEnhancePageHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ContextWeaver 提示词增强</title>
    <style>
      :root {
        --bg: #000;
        --panel: #0a0a0a;
        --border: rgba(255, 255, 255, 0.15);
        --text: rgba(255, 255, 255, 0.92);
        --muted: rgba(255, 255, 255, 0.6);
        --muted2: rgba(255, 255, 255, 0.4);
        --btn: rgba(255, 255, 255, 0.1);
        --btnHover: rgba(255, 255, 255, 0.18);
        --primary: #fff;
        --primaryText: #000;
        --danger: rgba(255, 255, 255, 0.06);
        --dangerBorder: rgba(255, 255, 255, 0.25);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
          'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
        background: var(--bg);
        color: var(--text);
      }

      .container {
        max-width: 1200px;
        margin: 28px auto;
        padding: 0 16px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }

      .title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .countdown {
        font-size: 12px;
        color: var(--muted2);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .countdown.warn {
        color: rgba(255, 255, 255, 0.85);
        font-weight: 600;
      }

      .meta {
        font-size: 12px;
        color: var(--muted2);
        text-align: right;
        line-height: 1.4;
        word-break: break-word;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        height: min(720px, calc(100vh - 240px));
        height: min(720px, calc(100dvh - 240px));
        min-height: 520px;
      }

      @media (max-width: 920px) {
        .grid {
          grid-template-columns: 1fr;
          height: auto;
          min-height: 0;
        }

        .header-right {
          width: 100%;
          justify-content: flex-start;
        }

        .meta {
          text-align: left;
        }
      }

      .col {
        padding: 14px;
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 0;
      }
      .col:last-child {
        border-right: none;
      }

      @media (max-width: 920px) {
        .col {
          border-right: none;
          border-bottom: 1px solid var(--border);
        }

        .col:last-child {
          border-bottom: none;
        }

        textarea {
          min-height: 320px;
        }
      }

      .label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        color: var(--muted);
        margin: 4px 2px 0;
        letter-spacing: 0.5px;
      }

      textarea {
        width: 100%;
        flex: 1;
        min-height: 0;
        padding: 12px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
          'Courier New', monospace;
        font-size: 13px;
        line-height: 1.55;
        resize: none;
        outline: none;
        overflow: auto;
        scrollbar-gutter: stable;
      }

      textarea:focus {
        border-color: rgba(255, 255, 255, 0.45);
        outline: 2px solid rgba(255, 255, 255, 0.28);
        outline-offset: -2px;
      }

      .footer {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-top: 1px solid var(--border);
        background: rgba(0, 0, 0, 0.5);
        flex-wrap: wrap;
      }

      .hint {
        font-size: 12px;
        color: var(--muted2);
        line-height: 1.45;
        flex: 1 1 260px;
        min-width: 220px;
      }

      .buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      @media (max-width: 520px) {
        .buttons {
          width: 100%;
          justify-content: stretch;
        }

        .buttons button {
          flex: 1 1 auto;
          justify-content: center;
        }
      }

      button {
        appearance: none;
        border: 1px solid var(--border);
        background: var(--btn);
        color: var(--text);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
        transition: 120ms ease;
      }

      button:hover {
        background: var(--btnHover);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .primary {
        background: var(--primary);
        color: var(--primaryText);
        border-color: var(--primary);
      }
      .primary:hover {
        background: rgba(255, 255, 255, 0.85);
      }

      .danger {
        background: var(--danger);
        border-color: var(--dangerBorder);
      }
      .danger:hover {
        background: rgba(255, 255, 255, 0.12);
      }

      .status {
        margin-top: 10px;
        font-size: 12px;
        color: var(--muted);
      }

      .status.error {
        color: rgba(255, 120, 120, 0.95);
      }

      .status.success {
        color: rgba(255, 255, 255, 0.8);
      }

      .loading {
        opacity: 0.85;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="title">ContextWeaver 提示词增强</div>
        <div class="header-right">
          <div class="countdown" id="countdown"></div>
          <div class="meta" id="meta">加载中…</div>
        </div>
      </div>

      <div class="panel">
        <div class="grid">
          <div class="col">
            <div class="label">
              <span>原始提示词（可编辑）</span>
              <span id="origCount">0 字符</span>
            </div>
            <textarea id="original" spellcheck="false" aria-label="原始提示词"></textarea>
          </div>
          <div class="col">
            <div class="label">
              <span>增强后提示词（可编辑）</span>
              <span id="enhCount">0 字符</span>
            </div>
            <textarea id="enhanced" spellcheck="false" aria-label="增强后提示词"></textarea>
          </div>
        </div>

        <div class="footer">
          <div class="hint">
            提示：编辑左栏后点击「重新增强」；微调右栏后点击「使用编辑版」。
            <div class="status" id="status"></div>
          </div>
          <div class="buttons">
            <button id="useOriginalBtn">使用原始</button>
            <button id="reEnhanceBtn">重新增强</button>
            <button class="danger" id="cancelBtn">取消</button>
            <button id="useEditedBtn" style="display: none">使用编辑版</button>
            <button class="primary" id="useEnhancedBtn">使用增强版</button>
          </div>
        </div>
      </div>
    </div>

    <script>
      const originalEl = document.getElementById('original');
      const enhancedEl = document.getElementById('enhanced');
      const statusEl = document.getElementById('status');
      const metaEl = document.getElementById('meta');
      const useOriginalBtn = document.getElementById('useOriginalBtn');
      const useEnhancedBtn = document.getElementById('useEnhancedBtn');
      const useEditedBtn = document.getElementById('useEditedBtn');
      const reEnhanceBtn = document.getElementById('reEnhanceBtn');
      const origCountEl = document.getElementById('origCount');
      const enhCountEl = document.getElementById('enhCount');
      const cancelBtn = document.getElementById('cancelBtn');
      const countdownEl = document.getElementById('countdown');

      let baselineEnhanced = '';
      const TIMEOUT_MS = 8 * 60 * 1000;
      const startTime = Date.now();
      let countdownTimer;

      function updateCountdown() {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, TIMEOUT_MS - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const str = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        countdownEl.textContent = '剩余 ' + str;
        countdownEl.className = remaining <= 60000 ? 'countdown warn' : 'countdown';
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          countdownEl.textContent = '已超时';
          setStatus('会话超时，已自动采用增强版结果。', 'success');
        }
      }

      countdownTimer = setInterval(updateCountdown, 1000);
      updateCountdown();

      function setStatus(message, kind) {
        statusEl.textContent = message || '';
        statusEl.className = 'status' + (kind ? ' ' + kind : '');
      }

      function updateCounts() {
        origCountEl.textContent = (originalEl.value || '').length + ' 字符';
        enhCountEl.textContent = (enhancedEl.value || '').length + ' 字符';

        const edited = (enhancedEl.value || '').trim() && enhancedEl.value !== baselineEnhanced;
        useEditedBtn.style.display = edited ? 'inline-block' : 'none';
        useEditedBtn.disabled = !edited;
      }

      originalEl.addEventListener('input', updateCounts);
      enhancedEl.addEventListener('input', updateCounts);

      async function jsonFetch(path, body) {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || '请求失败');
        }
        return data;
      }

      async function loadSession() {
        setStatus('正在加载会话…');
        const res = await fetch('/api/session');
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || '加载失败');
        }

        originalEl.value = data.original || '';
        enhancedEl.value = data.enhanced || '';
        baselineEnhanced = enhancedEl.value;

        metaEl.textContent =
          '端点: ' + (data.endpoint || '-') + ' | 模型: ' + (data.model || '-');
        setStatus('就绪。');
        updateCounts();
      }

      async function submit(action, text) {
        useOriginalBtn.disabled = true;
        useEnhancedBtn.disabled = true;
        useEditedBtn.disabled = true;
        reEnhanceBtn.disabled = true;
        cancelBtn.disabled = true;

        try {
          setStatus('正在提交…');
          await jsonFetch('/api/submit', { action, text });
          clearInterval(countdownTimer);
          setStatus('完成！可以关闭此页面。', 'success');
        } catch (e) {
          const message = e && e.message ? e.message : String(e);
          setStatus(message, 'error');

          useOriginalBtn.disabled = false;
          useEnhancedBtn.disabled = false;
          useEditedBtn.disabled = false;
          reEnhanceBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      }

      useOriginalBtn.addEventListener('click', () => submit('use-original'));
      useEnhancedBtn.addEventListener('click', () => submit('use-enhanced'));
      useEditedBtn.addEventListener('click', () => submit('use-edited', enhancedEl.value));
      cancelBtn.addEventListener('click', () => submit('cancel'));

      reEnhanceBtn.addEventListener('click', async () => {
        const current = (originalEl.value || '').trim();
        if (!current) {
          setStatus('原始提示词为空。', 'error');
          return;
        }

        useOriginalBtn.disabled = true;
        useEnhancedBtn.disabled = true;
        useEditedBtn.disabled = true;
        reEnhanceBtn.disabled = true;
        cancelBtn.disabled = true;
        document.body.classList.add('loading');
        setStatus('正在增强…');

        try {
          const data = await jsonFetch('/api/re-enhance', { prompt: current });
          enhancedEl.value = data.enhanced;
          baselineEnhanced = enhancedEl.value;
          setStatus('增强完成，可继续编辑或提交。', 'success');
          updateCounts();
        } catch (e) {
          const message = e && e.message ? e.message : String(e);
          setStatus(message, 'error');
        } finally {
          useOriginalBtn.disabled = false;
          useEnhancedBtn.disabled = false;
          useEditedBtn.disabled = false;
          reEnhanceBtn.disabled = false;
          cancelBtn.disabled = false;
          document.body.classList.remove('loading');
        }
      });

      loadSession().catch((e) => {
        const message = e && e.message ? e.message : String(e);
        setStatus(message, 'error');
        metaEl.textContent = '加载失败';
      });
    </script>
  </body>
</html>`;
}
