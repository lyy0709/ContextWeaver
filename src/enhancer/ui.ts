export function getEnhancePageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ContextWeaver Prompt Enhancer</title>
    <style>
      :root {
        --bg: #0b0f19;
        --panel: #111827;
        --border: rgba(255, 255, 255, 0.12);
        --text: rgba(255, 255, 255, 0.92);
        --muted: rgba(255, 255, 255, 0.72);
        --muted2: rgba(255, 255, 255, 0.56);
        --btn: rgba(255, 255, 255, 0.14);
        --btnHover: rgba(255, 255, 255, 0.22);
        --primary: #2563eb;
        --primaryHover: #1d4ed8;
        --danger: #ef4444;
        --dangerHover: #dc2626;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
          'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
        background: radial-gradient(800px circle at 0% 0%, rgba(37, 99, 235, 0.25), transparent 45%),
          radial-gradient(800px circle at 100% 0%, rgba(99, 102, 241, 0.18), transparent 45%),
          var(--bg);
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
      }

      .title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .meta {
        font-size: 12px;
        color: var(--muted2);
        text-align: right;
        line-height: 1.4;
      }

      .panel {
        background: rgba(17, 24, 39, 0.92);
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        min-height: 520px;
      }

      @media (max-width: 920px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      .col {
        padding: 14px;
        border-right: 1px solid var(--border);
      }
      .col:last-child {
        border-right: none;
      }

      .label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        color: var(--muted);
        margin: 4px 2px 10px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      textarea {
        width: 100%;
        height: 100%;
        min-height: 440px;
        padding: 12px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.28);
        color: var(--text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
          'Courier New', monospace;
        font-size: 13px;
        line-height: 1.55;
        resize: vertical;
        outline: none;
      }

      textarea:focus {
        border-color: rgba(37, 99, 235, 0.7);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.22);
      }

      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-top: 1px solid var(--border);
        background: rgba(17, 24, 39, 0.98);
      }

      .hint {
        font-size: 12px;
        color: var(--muted2);
        line-height: 1.45;
      }

      .buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
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
        border-color: rgba(255, 255, 255, 0.15);
      }
      .primary:hover {
        background: var(--primaryHover);
      }

      .danger {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.4);
      }
      .danger:hover {
        background: rgba(239, 68, 68, 0.18);
        border-color: rgba(239, 68, 68, 0.5);
      }

      .status {
        margin-top: 10px;
        font-size: 12px;
        color: var(--muted);
      }

      .status.error {
        color: rgba(248, 113, 113, 0.98);
      }

      .status.success {
        color: rgba(34, 197, 94, 0.98);
      }

      .loading {
        opacity: 0.85;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="title">ContextWeaver Prompt Enhancer</div>
        <div class="meta" id="meta">Loading…</div>
      </div>

      <div class="panel">
        <div class="grid">
          <div class="col">
            <div class="label">
              <span>Original prompt (editable)</span>
              <span id="origCount">0 chars</span>
            </div>
            <textarea id="original" spellcheck="false" aria-label="Original prompt"></textarea>
          </div>
          <div class="col">
            <div class="label">
              <span>Enhanced prompt (editable)</span>
              <span id="enhCount">0 chars</span>
            </div>
            <textarea id="enhanced" spellcheck="false" aria-label="Enhanced prompt"></textarea>
          </div>
        </div>

        <div class="footer">
          <div class="hint">
            Tip: edit left box, click Re-enhance; tweak right box, click Use Edited.
            <div class="status" id="status"></div>
          </div>
          <div class="buttons">
            <button id="useOriginalBtn">Use Original</button>
            <button id="reEnhanceBtn">Re-enhance</button>
            <button class="danger" id="cancelBtn">Cancel</button>
            <button id="useEditedBtn" style="display: none">Use Edited</button>
            <button class="primary" id="useEnhancedBtn">Use Enhanced</button>
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

      let baselineEnhanced = '';

      function setStatus(message, kind) {
        statusEl.textContent = message || '';
        statusEl.className = 'status' + (kind ? ' ' + kind : '');
      }

      function updateCounts() {
        origCountEl.textContent = (originalEl.value || '').length + ' chars';
        enhCountEl.textContent = (enhancedEl.value || '').length + ' chars';

        const edited = (enhancedEl.value || '').trim() && enhancedEl.value !== baselineEnhanced;
        useEditedBtn.style.display = edited ? 'inline-block' : 'none';
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
          throw new Error(data.error || 'Request failed');
        }
        return data;
      }


      async function loadSession() {
        setStatus('Loading session…');
        const res = await fetch('/api/session');
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Load failed');
        }

        originalEl.value = data.original || '';
        enhancedEl.value = data.enhanced || '';
        baselineEnhanced = enhancedEl.value;


        metaEl.textContent =
          'Endpoint: ' + (data.endpoint || '-') + ' | Model: ' + (data.model || '-');
        setStatus('Ready.');
        updateCounts();
      }

      async function submit(action, text) {
        useOriginalBtn.disabled = true;
        useEnhancedBtn.disabled = true;
        useEditedBtn.disabled = true;
        reEnhanceBtn.disabled = true;
        cancelBtn.disabled = true;

        try {
          setStatus('Submitting…');
          await jsonFetch('/api/submit', { action, text });
          setStatus('Done! You can close this tab.', 'success');
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
          setStatus('Original prompt is empty.', 'error');
          return;
        }

        useOriginalBtn.disabled = true;
        useEnhancedBtn.disabled = true;
        useEditedBtn.disabled = true;
        reEnhanceBtn.disabled = true;
        cancelBtn.disabled = true;
        document.body.classList.add('loading');
        setStatus('Enhancing…');

        try {
          const data = await jsonFetch('/api/re-enhance', { prompt: current });
          enhancedEl.value = data.enhanced;
          baselineEnhanced = enhancedEl.value;
          setStatus('Enhanced. You can keep editing or submit.', 'success');
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
        metaEl.textContent = 'Failed to load.';
      });
    </script>
  </body>
</html>`;
}
