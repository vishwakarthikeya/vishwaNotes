// ========== pin-auth.js ==========
(function() {
  const STORED_PIN_KEY = 'securePIN'; // encoded
  let currentPin = '';
  const MAX_LEN = 4;
  let isFirstTime = true;

  function encodePin(plain) { // trivial obfuscation (not secure but better than plain)
    return btoa(plain.split('').map(c => String.fromCharCode(c.charCodeAt(0)+1)).join(''));
  }
  function decodePin(encoded) {
    try { let tmp = atob(encoded); return tmp.split('').map(c => String.fromCharCode(c.charCodeAt(0)-1)).join(''); }
    catch { return ''; }
  }

  window.PINAuth = {
    init: function() {
      const existing = localStorage.getItem(STORED_PIN_KEY);
      if (existing) isFirstTime = false;
      this.renderKeypad();
    },
    renderKeypad: function() {
      const pad = document.querySelector('.pin-keypad');
      if (!pad) return;
      pad.innerHTML = '';
      for (let i=1; i<=9; i++) {
        const btn = document.createElement('button');
        btn.textContent = i; btn.classList.add('pin-key'); btn.dataset.digit = i;
        btn.addEventListener('click', () => this.enterDigit(i));
        pad.appendChild(btn);
      }
      const zero = document.createElement('button');
      zero.textContent = 0; zero.classList.add('pin-key'); zero.dataset.digit = 0;
      zero.addEventListener('click', () => this.enterDigit(0));
      pad.appendChild(zero);
      const clear = document.createElement('button');
      clear.textContent = '⌫'; clear.classList.add('pin-key');
      clear.addEventListener('click', () => this.clearDigit());
      pad.appendChild(clear);
    },
    enterDigit: function(d) {
      if (currentPin.length < MAX_LEN) {
        currentPin += d;
        this.updateDots();
        if (currentPin.length === MAX_LEN) this.verifyPin();
      }
    },
    clearDigit: function() { currentPin = currentPin.slice(0,-1); this.updateDots(); },
    updateDots: function() {
      document.querySelectorAll('.pin-dot').forEach((dot,i)=> {
        if (i < currentPin.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
      });
    },
    verifyPin: function() {
      const existing = localStorage.getItem(STORED_PIN_KEY);
      if (!existing) { // first time setup
        localStorage.setItem(STORED_PIN_KEY, encodePin(currentPin));
        isFirstTime = false;
        this.onSuccess();
        return;
      }
      const realPin = decodePin(existing);
      if (currentPin === realPin) {
        this.onSuccess();
      } else {
        document.querySelector('.lock-card').classList.add('shake');
        setTimeout(()=> document.querySelector('.lock-card').classList.remove('shake'), 400);
        currentPin = ''; this.updateDots();
      }
    },
    onSuccess: function() {
      document.getElementById('lock-screen').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
    }
  };
})();