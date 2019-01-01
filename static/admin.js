const upload = document.getElementById('upload');
const uploadPanel = document.getElementById('uploadPanel');
const previewPc = document.getElementById('previewPc');
const previewMobile = document.getElementById('previewMobile');
const passwordShield = document.getElementById('passwordShield');
const passwordButton = document.getElementById('passwordSubmit');
const passwordInput = document.getElementById('password');
const template = document.getElementById('imageBlock').content;
const uploads = document.getElementById('uploads');

const clampDimensions = (width, height, limit) => {
  const ratio = limit / Math.min(width, height);

  return {
    width: Math.round(ratio * width),
    height: Math.round(ratio * height),
  };
};

const getImageBlock = file => {
  const block = template.cloneNode(true);
  const landscapePreview = block.querySelector('.landscapePreview');
  const portraitPreview = block.querySelector('.portraitPreview');
  const name = block.querySelector('.name');
  const upload = block.querySelector('.upload');
  const remove = block.querySelector('.remove');
  const spinnerContainer = block.querySelector('.spinnerContainer');

  remove.addEventListener('click', e => {
    e.target.parentElement.parentElement.remove();
  });

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();

    img.addEventListener('load', () => {
      const canvas = fuck(img, 320);
      const x = canvas.toDataURL('image/jpeg', 0.9);
      landscapePreview.src = x;
      portraitPreview.src = x;
      spinnerContainer.style.display = 'none';

      fuck(img, 2000).toBlob(
        b => {
          upload.addEventListener('click', async e => {
            upload.disabled = true;
            remove.disabled = true;
            spinnerContainer.style.display = 'flex';
            const password = localStorage.getItem('password');

            await fetch('/admin/pic', {
              method: 'POST',
              headers: new Headers({ password }),
              body: new File([b], file.name, { type: 'image/jpeg' }),
            });

            e.target.parentElement.parentElement.remove();
          });
          upload.disabled = false;
        },
        'image/jpeg',
        0.93,
      );
    });

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);

  name.innerHTML = file.name;
  landscapePreview.src;

  return block;
};

uploadPanel.addEventListener('drag', e => {
  e.preventDefault();
  e.stopPropagation();
});

uploadPanel.addEventListener('dragstart', e => {
  e.preventDefault();
  e.stopPropagation();
});

uploadPanel.addEventListener('dragend', e => {
  e.preventDefault();
  e.stopPropagation();
  uploadPanel.classList.remove('drag');
});

uploadPanel.addEventListener('dragover', e => {
  e.preventDefault();
  e.stopPropagation();
  uploadPanel.classList.add('drag');
});

uploadPanel.addEventListener('dragenter', e => {
  e.preventDefault();
  e.stopPropagation();
  uploadPanel.classList.add('drag');
});

uploadPanel.addEventListener('dragleave', e => {
  e.preventDefault();
  e.stopPropagation();
  uploadPanel.classList.remove('drag');
});

uploadPanel.addEventListener('drop', e => {
  e.preventDefault();
  e.stopPropagation();
  uploadPanel.classList.remove('drag');
  [...e.dataTransfer.files].forEach(file => {
    uploads.appendChild(getImageBlock(file));
  });
});

function fuck(img, size) {
  const canvas = document.createElement('canvas');
  const { width, height } = clampDimensions(img.width, img.height, size);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

upload.addEventListener('change', () => {
  if (upload.files) {
    [...upload.files].forEach(file => {
      uploads.appendChild(getImageBlock(file));
    });
  }
});

if (localStorage.getItem('password')) {
  passwordShield.style.display = 'none';
} else {
  passwordShield.addEventListener('submit', async e => {
    const password = passwordInput.value;
    passwordInput.disabled = true;
    passwordButton.disabled = true;
    e.preventDefault();

    const status = await fetch('/admin/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    }).then(x => x.status);

    switch (status) {
      case 204:
        passwordShield.classList.add('right');
        setTimeout(() => {
          passwordShield.style.display = 'none';
        }, 300);

        // this is a bad idea really
        localStorage.setItem('password', password);

        return;

      default:
        passwordShield.classList.add('wrong');
        setTimeout(() => {
          passwordShield.classList.remove('wrong');
          passwordInput.disabled = false;
          passwordButton.disabled = false;
        }, 700);

        return;
    }
  });
}