// ── Character counter ──────────────────────────────────────────────────────
function updateCharCount() {
  const text = document.getElementById('inputText').value;
  document.getElementById('charCount').textContent = text.length;
}

// ── Clear input ────────────────────────────────────────────────────────────
function clearInput() {
  document.getElementById('inputText').value = '';
  document.getElementById('outputText').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('outputCharCount').textContent = '0 characters';
  document.getElementById('detectedBadge').style.display = 'none';
  hideStatus();
}

// ── Swap languages ─────────────────────────────────────────────────────────
function swapLanguages() {
  const srcSel = document.getElementById('sourceLang');
  const tgtSel = document.getElementById('targetLang');

  const srcVal = srcSel.value;
  const tgtVal = tgtSel.value;

  if (srcVal === 'auto') {
    showToast('Cannot swap when source is Auto Detect.');
    return;
  }

  srcSel.value = tgtVal;
  tgtSel.value = srcVal;

  const inputTA = document.getElementById('inputText');
  const outputTA = document.getElementById('outputText');
  const inputText = inputTA.value;
  inputTA.value = outputTA.value;
  outputTA.value = inputText;
  updateCharCount();

  const outLen = outputTA.value.length;
  document.getElementById('outputCharCount').textContent = outLen + ' characters';
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Status bar ─────────────────────────────────────────────────────────────
function showStatus(msg, type) {
  const bar = document.getElementById('statusBar');
  bar.textContent = msg;
  bar.className = 'status-bar ' + type;
}

function hideStatus() {
  const bar = document.getElementById('statusBar');
  bar.className = 'status-bar';
}

// ── Set loading state ──────────────────────────────────────────────────────
function setLoading(state) {
  const btn = document.getElementById('translateBtn');
  const icon = document.getElementById('btnIcon');
  const label = document.getElementById('btnLabel');
  const loader = document.getElementById('loader');

  btn.disabled = state;
  icon.style.display = state ? 'none' : 'inline';
  label.textContent = state ? 'Translating...' : 'Translate';
  loader.style.display = state ? 'block' : 'none';
}

// ── Main translation function ──────────────────────────────────────────────
async function translateText() {
  const inputText = document.getElementById('inputText').value.trim();
  const sourceLang = document.getElementById('sourceLang').value;
  const targetLang = document.getElementById('targetLang').value;

  if (!inputText) {
    showStatus('⚠ Please enter some text to translate.', 'error');
    return;
  }

  if (sourceLang !== 'auto' && sourceLang === targetLang) {
    showStatus('⚠ Source and target languages are the same.', 'error');
    return;
  }

  hideStatus();
  setLoading(true);

  const langPair = (sourceLang === 'auto' ? 'autodetect' : sourceLang) + '|' + targetLang;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${langPair}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus === 200) {
      const translated = data.responseData.translatedText;
      document.getElementById('outputText').value = translated;
      document.getElementById('outputCharCount').textContent = translated.length + ' characters';

      if (sourceLang === 'auto' && data.responseData.detectedLanguage) {
        const badge = document.getElementById('detectedBadge');
        badge.textContent = 'Detected: ' + data.responseData.detectedLanguage;
        badge.style.display = 'inline-block';
      } else {
        document.getElementById('detectedBadge').style.display = 'none';
      }

      showStatus('✓ Translation successful!', 'info');
    } else {
      throw new Error(data.responseDetails || 'Translation failed.');
    }

  } catch (err) {
    showStatus('✗ Error: ' + err.message, 'error');
    document.getElementById('outputText').value = '';
  } finally {
    setLoading(false);
  }
}

// ── Copy translation ───────────────────────────────────────────────────────
function copyTranslation() {
  const output = document.getElementById('outputText').value;
  if (!output) {
    showToast('Nothing to copy yet!');
    return;
  }
  navigator.clipboard.writeText(output)
    .then(() => showToast('✓ Copied to clipboard!'))
    .catch(() => {
      const ta = document.getElementById('outputText');
      ta.select();
      document.execCommand('copy');
      showToast('✓ Copied to clipboard!');
    });
}

// ── Text-to-Speech ─────────────────────────────────────────────────────────
function speakText(panel) {
  if (!window.speechSynthesis) {
    showToast('Text-to-speech is not supported in your browser.');
    return;
  }

  const text = panel === 'input'
    ? document.getElementById('inputText').value.trim()
    : document.getElementById('outputText').value.trim();

  if (!text) {
    showToast('No text to speak!');
    return;
  }

  const langCode = panel === 'input'
    ? document.getElementById('sourceLang').value
    : document.getElementById('targetLang').value;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode === 'auto' ? 'en' : langCode;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// ── Allow Ctrl+Enter to translate ─────────────────────────────────────────
document.getElementById('inputText').addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === 'Enter') {
    translateText();
  }
});

// ── Auto-update char count on paste ───────────────────────────────────────
document.getElementById('inputText').addEventListener('paste', function () {
  setTimeout(() => {
    const text = document.getElementById('inputText').value.trim();
    if (text.length > 0 && text.length <= 5000) {
      updateCharCount();
    }
  }, 100);
});
