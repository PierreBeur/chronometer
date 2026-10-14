// Time
const time = document.querySelector('#time');
function updateTime() {
  time.textContent = (new Date()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
updateTime();
setInterval(updateTime, 1000);

// Date
const date = document.querySelector('#date');
function updateDate() {
  const d = new Date();
  const weekday = d.toLocaleDateString([], {weekday: 'short'}).toUpperCase();
  const day = d.toLocaleDateString([], {day: '2-digit'});
  const month = d.toLocaleDateString([], {month: 'short'}).toUpperCase();
  date.textContent = `${weekday} ${day} ${month}`;
}
updateDate();
setInterval(updateDate, 1000);


// Storage

const ls = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    return JSON.parse(localStorage.getItem(key));
  }
}

const dbp = idb.openDB('chronometer-photo-history', 1, {
  upgrade(db) {
    db.createObjectStore('photo-history', {
      keyPath: 'id',
      autoIncrement: true
    });
  }
});

const db = {
  async putPhoto(photo) {
    const id = await (await dbp).put('photo-history', photo);
    ls.set('currentPhotoID', id);
  },
  async getPhoto(offset) {
    const id = ls.get('currentPhotoID') ?? 0;
    return await (await dbp).get('photo-history', id + offset);
  }
}


// Photo

// Photo view

const photoViewContainer = document.querySelector('#photo-view-container');
const photoViews = photoViewContainer.querySelectorAll('.photo-view');

// Initialize photo views
photoViews.forEach((photoView, i) => {
  photoView.addEventListener('load', () => {
    photoViews[i ? 0 : 1].classList.remove('active');
    photoView.classList.add('transition');
    photoView.classList.add('active');
  });
});

function setPhotoView(src) {
  photoViewContainer.querySelector(':not(.active)').src = src;
}

function setBrightness(brightness) {
  ls.set('photoBrightness', brightness);
  photoViewContainer.style.setProperty('--brightness', brightness);
}

function setTransitionDuration(transitionDuration) {
  photoViewContainer.style.setProperty('--transition-duration', transitionDuration + 'ms');
}

// Photo attribution
const utm = '?utm_source=Chronometer&utm_medium=referral&utm_campaign=api-credit';
const attributionPhoto = document.querySelector('#attribution-photo');
const attributionUser = document.querySelector('#attribution-user');
const attributionUnsplash = document.querySelector('#attribution-unsplash');
function setAttribution(attribution) {
  attributionPhoto.href = attribution.link + utm;
  attributionUser.href = attribution.userLink + utm;
  attributionUser.textContent = attribution.userName;
  attributionUnsplash.href = 'https://unsplash.com/' + utm;
}

// Photo location
const photoLocation = document.querySelector('#photo-location');
const photoLocationPosition = document.querySelector('#photo-location-position');
function setPhotoLocation(locationData) {
  const name = locationData.name;
  photoLocation.textContent = name;
  photoLocation.href = name ? 'https://www.google.com/search?q=' + encodeURIComponent(name) : '';
  const [latitude, longitude] = [locationData.position.latitude, locationData.position.longitude];
  const validPosition = latitude && longitude;
  photoLocationPosition.href = validPosition ? `https://www.google.com/maps/place/${latitude}%2C${longitude}` : '';
  photoLocationPosition.classList.toggle('hidden', !validPosition);
}

function setPhoto(photo) {
  db.putPhoto(photo);
  setPhotoView(photo.src + `&w=${screen.width}&h=${screen.height}&fit=crop`);
  setAttribution(photo.attribution);
  setPhotoLocation(photo.location);
}

// API parameters
const collection = 1053828;
const url = 'https://chronometer-api.pierrebeur0.workers.dev/photos/random?';

function fetchPhoto() {
  const params = new URLSearchParams([
    ['collections', collection]
  ]);
  return fetch(url + params)
    .then(response => response.json())
    .then(data => {
      return {
        src: data.urls.raw,
        attribution: {
          link: data.links.html,
          userLink: data.user.links.html,
          userName: data.user.name
        },
        location: {
          name: data.location.name,
          position: data.location.position
        }
      };
    })
    .catch(error => console.error(error));
}

async function newPhoto() {
  const photo = await fetchPhoto();
  if (photo) setPhoto(photo);
}
// New photo when refresh button clicked
const refreshButton = document.querySelector('#refresh-button');
refreshButton.addEventListener('click', newPhoto);
// New photo when space key pressed
document.addEventListener('keydown', event => {
  if (event.key == ' ') newPhoto();
});

async function prevPhoto() {
  const photo = await db.getPhoto(-1);
  if (photo) setPhoto(photo);
}
// Get prev photo when prev photo button clicked
const photoPrevButton = document.querySelector('#photo-prev-button');
photoPrevButton.addEventListener('click', prevPhoto);
// Get prev photo when left arrow key pressed
document.addEventListener('keydown', event => {
  if (event.key == 'ArrowLeft') prevPhoto();
});

async function nextPhoto() {
  setPhoto(await db.getPhoto(1) ?? await fetchPhoto());
}
// Get next photo when next photo button clicked
const photoNextButton = document.querySelector('#photo-next-button');
photoNextButton.addEventListener('click', nextPhoto);
// Get prev photo when right arrow key pressed
document.addEventListener('keydown', event => {
  if (event.key == 'ArrowRight') nextPhoto();
});

// Set photo to current photo or new photo on page load
async function currentPhoto() {
  setPhoto(await db.getPhoto(0) ?? await fetchPhoto());
}
currentPhoto();


// Menu

const menuWrapper = document.querySelector('#menu-wrapper');
const menuButton = document.querySelector('#menu-button');
function toggleMenu() {
  menuWrapper.classList.toggle('menu-open');
  menuButton.classList.toggle('menu-open');
}
// Toggle menu when menu button clicked
menuButton.addEventListener('click', toggleMenu);
// Toggle menu when escape key pressed
document.addEventListener('keydown', event => {
  if (event.key == 'Escape') toggleMenu();
});

// Menu Options

// Photo

// Brightness

const brightness = document.querySelector('#brightness');
brightness.addEventListener('input', () => {
  setBrightness(parseFloat(brightness.value));
});
brightness.value = ls.get('photoBrightness') ?? .8
brightness.dispatchEvent(new Event('input'));
