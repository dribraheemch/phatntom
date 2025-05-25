// UI Elements
const mainScreen = document.getElementById('main-screen');
const codeScreen = document.getElementById('code-screen');
const decodeScreen = document.getElementById('decode-screen');

const btnCode = document.getElementById('btn-code');
const btnDecode = document.getElementById('btn-decode');

const btnPaste = document.getElementById('btn-paste');
const btnEncode = document.getElementById('btn-encode');
const btnCodeBack = document.getElementById('btn-code-back');

const inputText = document.getElementById('input-text');
const typingMsg = document.getElementById('typing-msg');
const encodeCanvas = document.getElementById('encode-canvas');
const shareMsg = document.getElementById('share-msg');

const btnSaveImage = document.getElementById('btn-save-image');

const fileUpload = document.getElementById('file-upload');
const btnDecodeAction = document.getElementById('btn-decode-action');
const decodeCanvas = document.getElementById('decode-canvas');
const decodedTextDiv = document.getElementById('decoded-text');
const btnDecodeBack = document.getElementById('btn-decode-back');

// Navigation handlers
btnCode.addEventListener('click', () => {
  mainScreen.classList.add('hidden');
  codeScreen.classList.remove('hidden');
  inputText.value = '';
  typingMsg.classList.add('hidden');
  encodeCanvas.classList.add('hidden');
  shareMsg.classList.add('hidden');
  btnSaveImage.classList.add('hidden');
});

btnDecode.addEventListener('click', () => {
  mainScreen.classList.add('hidden');
  decodeScreen.classList.remove('hidden');
  decodeCanvas.classList.add('hidden');
  decodedTextDiv.textContent = '';
  fileUpload.value = null;
});

btnCodeBack.addEventListener('click', () => {
  codeScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
});

btnDecodeBack.addEventListener('click', () => {
  decodeScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
});

// Clipboard paste (works on HTTPS or localhost)
btnPaste.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    inputText.value = text;
  } catch (e) {
    alert('Clipboard access denied or unavailable.');
  }
});

// Helpers: text to binary and binary to text
function textToBinary(text) {
  return text
    .split('')
    .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

function binaryToText(binary) {
  let result = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.substr(i, 8);
    if (byte.length < 8) break;
    result += String.fromCharCode(parseInt(byte, 2));
  }
  return result;
}

// Encode function: draw pixel art from text binary
btnEncode.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) {
    alert('Please enter or paste some text!');
    return;
  }
  const binary = textToBinary(text);
  const pixelSize = 10;
  const pixelsPerRow = 32;
  const totalPixels = binary.length;
  const rows = Math.ceil(totalPixels / pixelsPerRow);

  encodeCanvas.width = pixelsPerRow * pixelSize;
  encodeCanvas.height = rows * pixelSize;

  const ctx = encodeCanvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, encodeCanvas.width, encodeCanvas.height);

  typingMsg.classList.remove('hidden');
  encodeCanvas.classList.add('hidden');
  shareMsg.classList.add('hidden');
  btnSaveImage.classList.add('hidden');

  setTimeout(() => {
    typingMsg.classList.add('hidden');
    encodeCanvas.classList.remove('hidden');
    shareMsg.classList.remove('hidden');
    btnSaveImage.classList.remove('hidden');

    for (let i = 0; i < totalPixels; i++) {
      const bit = binary[i];
      ctx.fillStyle = bit === '1' ? 'white' : 'black';
      const x = (i % pixelsPerRow) * pixelSize;
      const y = Math.floor(i / pixelsPerRow) * pixelSize;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }

    // Canvas click se image save karne ka option:
    encodeCanvas.style.cursor = "pointer";
    encodeCanvas.onclick = () => {
      const imageURI = encodeCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageURI;
      link.download = 'secret_pixel_code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  }, 2000);
});

// Save Image button functionality
btnSaveImage.addEventListener('click', () => {
  const imageURI = encodeCanvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.href = imageURI;
  link.download = 'secret_pixel_code.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Decode: read pixels from uploaded image and convert back to text
fileUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const ctx = decodeCanvas.getContext('2d');
      decodeCanvas.width = img.width;
      decodeCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      decodeCanvas.classList.remove('hidden');
      decodedTextDiv.textContent = '';
    }
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

btnDecodeAction.addEventListener('click', () => {
  if (decodeCanvas.classList.contains('hidden')) {
    alert('Please upload an image first!');
    return;
  }
  const ctx = decodeCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, decodeCanvas.width, decodeCanvas.height);
  const pixelSize = 10;
  const pixelsPerRow = 32;

  let binary = '';
  for (let y = 0; y < decodeCanvas.height; y += pixelSize) {
    for (let x = 0; x < decodeCanvas.width; x += pixelSize) {
      const px = x + Math.floor(pixelSize / 2);
      const py = y + Math.floor(pixelSize / 2);
      if (px >= decodeCanvas.width || py >= decodeCanvas.height) continue;
      const index = (py * decodeCanvas.width + px) * 4;
      const r = imgData.data[index];
      const g = imgData.data[index + 1];
      const b = imgData.data[index + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      binary += brightness > 127 ? '1' : '0';
    }
  }

  binary = binary.substr(0, Math.floor(binary.length / 8) * 8);

  const decodedText = binaryToText(binary);
  decodedTextDiv.textContent = decodedText || 'No valid message found.';
});
