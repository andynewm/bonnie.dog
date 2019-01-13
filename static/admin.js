const upload = document.getElementById('upload');
const imageList = document.getElementById('imageList');
const livePreviews = document.getElementById('livePreviews');
const livePreviewTemplate = document.getElementById('livePreview').content;
const livePreviewLandscape = document.getElementById('landscapeLivePreview');
const livePreviewPortrait = document.getElementById('portraitLivePreview');
const passwordShield = document.getElementById('passwordShield');
const passwordButton = document.getElementById('passwordSubmit');
const passwordInput = document.getElementById('password');
const template = document.getElementById('imageBlock').content;
const uploads = document.getElementById('uploads');
const indexOption = document.getElementById('indexOption');
const uploadOption = document.getElementById('uploadOption');
const indexPanel = document.getElementById('indexPanel');
const uploadPanel = document.getElementById('uploadPanel');

imageList.addEventListener('click', ({ target }) => {
  if (target.matches('img')) {
    livePreviewLandscape.src = target.src;
    livePreviewPortrait.src = target.src;
    livePreviews.style.display = '';
  }
});

livePreviews.addEventListener(
  'click',
  () => (livePreviews.style.display = 'none'),
);

indexOption.addEventListener('click', () => {
  indexOption.classList.add('active');
  indexPanel.classList.add('active');
  uploadOption.classList.remove('active');
  uploadPanel.classList.remove('active');
});

uploadOption.addEventListener('click', () => {
  indexOption.classList.remove('active');
  indexPanel.classList.remove('active');
  uploadOption.classList.add('active');
  uploadPanel.classList.add('active');
});

const clampDimensions = (width, height, limit) => {
  const ratio = limit / Math.min(width, height);

  return {
    width: Math.round(ratio * width),
    height: Math.round(ratio * height),
  };
};

const getLivePreview = url => {
  const block = livePreviewTemplate.cloneNode(true);
  const img = block.querySelector('img');
  img.src = `img/${url.slice(0, -4)}.preview.jpg`;

  return block;
};

const getImageBlock = file => {
  const block = template.cloneNode(true);
  const landscapePreview = block.querySelector('.landscapePreview');
  const portraitPreview = block.querySelector('.portraitPreview');
  const name = block.querySelector('.name');
  const upload = block.querySelector('.upload');
  const remove = block.querySelector('.remove');
  const spinnerContainer = block.querySelector('.spinnerContainer');

  remove.addEventListener('click', ({ target }) => {
    target.closest('.imageContainer').remove();
  });

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();

    img.addEventListener('load', () => {
      const canvas = fuck(img, 160);
      const x = canvas.toDataURL('image/jpeg', 0.9);
      landscapePreview.src = x;
      portraitPreview.src = x;
      spinnerContainer.style.display = 'none';

      fuck(img, 2000).toBlob(
        b => {
          upload.addEventListener('click', async ({ target }) => {
            upload.disabled = true;
            remove.disabled = true;
            spinnerContainer.style.display = 'flex';
            const password = localStorage.getItem('password');

            const response = await fetch('/admin/pic', {
              method: 'POST',
              headers: new Headers({ password }),
              body: new File([b], file.name, { type: 'image/jpeg' }),
            }).then(x => x.json());

            imageList.appendChild(getLivePreview(response.url));

            target.closest('.imageContainer').remove();
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
