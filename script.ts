import { openDB, type DBSchema } from "idb";

interface Photo {
  id?: number;
  src: string;
  attribution: {
    link: string;
    userLink: string;
    userName: string;
  };
  location: {
    name: string | null;
    position: {
      latitude: number | null;
      longitude: number | null;
    };
  };
}

interface PhotoHistory extends DBSchema {
  "photo-history": {
    key: number;
    value: Photo;
  };
}

type PreferenceKey = "currentPhotoID" | "photoBrightness";

// Time
const time = document.querySelector<HTMLDivElement>("#time")!;
function updateTime() {
  time.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
updateTime();
setInterval(updateTime, 1000);

// Date
const date = document.querySelector<HTMLDivElement>("#date")!;
function updateDate() {
  const d = new Date();
  const weekday = d.toLocaleDateString([], { weekday: "short" }).toUpperCase();
  const day = d.toLocaleDateString([], { day: "2-digit" });
  const month = d.toLocaleDateString([], { month: "short" }).toUpperCase();
  date.textContent = `${weekday} ${day} ${month}`;
}
updateDate();
setInterval(updateDate, 1000);

// Storage

const ls = {
  set(key: PreferenceKey, value: number) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key: PreferenceKey): number | null {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const value: unknown = JSON.parse(stored);
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  },
};

const dbp = openDB<PhotoHistory>("chronometer-photo-history", 1, {
  upgrade(db) {
    db.createObjectStore("photo-history", {
      keyPath: "id",
      autoIncrement: true,
    });
  },
});

const db = {
  async putPhoto(photo: Photo) {
    const id = await (await dbp).put("photo-history", photo);
    ls.set("currentPhotoID", id);
  },
  async getPhoto(offset: number) {
    const id = ls.get("currentPhotoID") ?? 0;
    return await (await dbp).get("photo-history", id + offset);
  },
};

// Photo

// Photo view

const photoViewContainer = document.querySelector<HTMLDivElement>("#photo-view-container")!;
const photoViews = photoViewContainer.querySelectorAll<HTMLImageElement>(".photo-view");

// Initialize photo views
photoViews.forEach((photoView, i) => {
  photoView.addEventListener("load", () => {
    const otherPhotoView = photoViews[i ? 0 : 1];
    if (!otherPhotoView) throw new Error("Missing alternate photo view");
    otherPhotoView.classList.remove("active");
    photoView.classList.add("transition");
    photoView.classList.add("active");
  });
});

function setPhotoView(src: string) {
  photoViewContainer.querySelector<HTMLImageElement>(".photo-view:not(.active)")!.src = src;
}

function setBrightness(brightness: number) {
  ls.set("photoBrightness", brightness);
  photoViewContainer.style.setProperty("--brightness", String(brightness));
}

// Photo attribution
const utm = "?utm_source=Chronometer&utm_medium=referral&utm_campaign=api-credit";
const attributionPhoto = document.querySelector<HTMLAnchorElement>("#attribution-photo")!;
const attributionUser = document.querySelector<HTMLAnchorElement>("#attribution-user")!;
const attributionUnsplash = document.querySelector<HTMLAnchorElement>("#attribution-unsplash")!;
function setAttribution(attribution: Photo["attribution"]) {
  attributionPhoto.href = attribution.link + utm;
  attributionUser.href = attribution.userLink + utm;
  attributionUser.textContent = attribution.userName;
  attributionUnsplash.href = "https://unsplash.com/" + utm;
}

// Photo location
const photoLocation = document.querySelector<HTMLAnchorElement>("#photo-location")!;
const photoLocationPosition = document.querySelector<HTMLAnchorElement>(
  "#photo-location-position",
)!;
function setPhotoLocation(locationData: Photo["location"]) {
  const name = locationData.name;
  photoLocation.textContent = name;
  photoLocation.href = name ? "https://www.google.com/search?q=" + encodeURIComponent(name) : "";
  const [latitude, longitude] = [locationData.position.latitude, locationData.position.longitude];
  const validPosition = latitude !== null && longitude !== null;
  photoLocationPosition.href = validPosition
    ? `https://www.google.com/maps/place/${latitude}%2C${longitude}`
    : "";
  photoLocationPosition.classList.toggle("hidden", !validPosition);
}

async function setPhoto(photo: Photo) {
  setPhotoView(photo.src + `&w=${screen.width}&h=${screen.height}&fit=crop`);
  setAttribution(photo.attribution);
  setPhotoLocation(photo.location);
  await db.putPhoto(photo);
}

// API parameters
const collection = 1053828;
const url = "https://chronometer-api.pierrebeur0.workers.dev/photos/random?";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fetchPhoto() {
  const params = new URLSearchParams([["collections", String(collection)]]);
  return fetch(url + params)
    .then((response) => {
      if (!response.ok) throw new Error(`Photo request failed: ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then((data): Photo => {
      if (
        !isRecord(data) ||
        !isRecord(data.urls) ||
        typeof data.urls.raw !== "string" ||
        !isRecord(data.links) ||
        typeof data.links.html !== "string" ||
        !isRecord(data.user) ||
        typeof data.user.name !== "string" ||
        !isRecord(data.user.links) ||
        typeof data.user.links.html !== "string"
      ) {
        throw new Error("Invalid photo response");
      }
      const location = isRecord(data.location) ? data.location : {};
      const position = isRecord(location.position) ? location.position : {};
      return {
        src: data.urls.raw,
        attribution: {
          link: data.links.html,
          userLink: data.user.links.html,
          userName: data.user.name,
        },
        location: {
          name: typeof location.name === "string" ? location.name : null,
          position: {
            latitude: typeof position.latitude === "number" ? position.latitude : null,
            longitude: typeof position.longitude === "number" ? position.longitude : null,
          },
        },
      };
    })
    .catch((error) => console.error(error));
}

async function newPhoto() {
  const photo = await fetchPhoto();
  if (photo) await setPhoto(photo);
}
// New photo when refresh button clicked
const refreshButton = document.querySelector<HTMLDivElement>("#refresh-button")!;
refreshButton.addEventListener("click", () => newPhoto().catch(console.error));
// New photo when space key pressed
document.addEventListener("keydown", (event) => {
  if (event.key == " ") newPhoto().catch(console.error);
});

async function prevPhoto() {
  const photo = await db.getPhoto(-1);
  if (photo) await setPhoto(photo);
}
// Get prev photo when prev photo button clicked
const photoPrevButton = document.querySelector<HTMLDivElement>("#photo-prev-button")!;
photoPrevButton.addEventListener("click", () => prevPhoto().catch(console.error));
// Get prev photo when left arrow key pressed
document.addEventListener("keydown", (event) => {
  if (event.key == "ArrowLeft") prevPhoto().catch(console.error);
});

async function nextPhoto() {
  const photo = (await db.getPhoto(1)) ?? (await fetchPhoto());
  if (photo) await setPhoto(photo);
}
// Get next photo when next photo button clicked
const photoNextButton = document.querySelector<HTMLDivElement>("#photo-next-button")!;
photoNextButton.addEventListener("click", () => nextPhoto().catch(console.error));
// Get prev photo when right arrow key pressed
document.addEventListener("keydown", (event) => {
  if (event.key == "ArrowRight") nextPhoto().catch(console.error);
});

// Set photo to current photo or new photo on page load
async function currentPhoto() {
  const photo = (await db.getPhoto(0)) ?? (await fetchPhoto());
  if (photo) await setPhoto(photo);
}
currentPhoto().catch(console.error);

// Menu

const menuWrapper = document.querySelector<HTMLDivElement>("#menu-wrapper")!;
const menuButton = document.querySelector<HTMLDivElement>("#menu-button")!;
function toggleMenu() {
  menuWrapper.classList.toggle("menu-open");
  menuButton.classList.toggle("menu-open");
}
// Toggle menu when menu button clicked
menuButton.addEventListener("click", toggleMenu);
// Toggle menu when escape key pressed
document.addEventListener("keydown", (event) => {
  if (event.key == "Escape") toggleMenu();
});

// Menu Options

// Photo

// Brightness

const brightness = document.querySelector<HTMLInputElement>("#brightness")!;
brightness.addEventListener("input", () => {
  setBrightness(parseFloat(brightness.value));
});
brightness.value = String(ls.get("photoBrightness") ?? 0.8);
brightness.dispatchEvent(new Event("input"));
