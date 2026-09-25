const BLOB_HOST = 'g1ebye9epu2u7epw.public.blob.vercel-storage.com';

let manifest = [];
let activePhotos = [];
let activeIndex = 0;
let activeEventSlug = null;
let lastFocus = null;

const eventNav = document.getElementById('eventNav');
const eventSections = document.getElementById('eventSections');
const lightbox = document.getElementById('lightbox');
const lbImage = document.getElementById('lbImage');
const lbCounter = document.getElementById('lbCounter');
const lbEvents = document.getElementById('lbEvents');
const pageParts = [
  document.querySelector('header'),
  document.querySelector('.event-nav-wrap'),
  eventSections,
];

function isPhotoUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === BLOB_HOST;
  } catch {
    return false;
  }
}

function creditLink(handle) {
  if (!/^@[\w.]+$/.test(handle)) return document.createTextNode(handle);
  const link = document.createElement('a');
  link.href = `https://www.instagram.com/${handle.slice(1)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = handle;
  return link;
}

function hashId() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ''));
  return /^[a-z0-9-]+$/i.test(id) ? id : '';
}

const rendered = new Set();

function renderPhotos(event) {
  if (rendered.has(event.slug)) return;
  rendered.add(event.slug);

  const masonry = document.querySelector(`#${CSS.escape(event.slug)} .photo-masonry`);
  if (!masonry) return;

  event.photos.forEach((photo, i) => {
    if (!isPhotoUrl(photo.thumb)) return;
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'photo-thumb';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = photo.thumb;
    img.alt = `${event.title} photo ${i + 1}`;
    img.addEventListener('load', () => img.classList.add('loaded'));
    thumb.appendChild(img);
    thumb.addEventListener('click', () => openLightbox(event.photos, i, event.slug));
    masonry.appendChild(thumb);
  });
}

function renderEvent(event) {
  const section = document.createElement('section');
  section.className = 'event-section';
  section.id = event.slug;

  const heading = document.createElement('div');
  heading.className = 'event-heading';
  const title = document.createElement('h2');
  title.className = 'event-title';
  title.textContent = event.title;
  const meta = document.createElement('p');
  meta.className = 'event-meta';
  meta.append(event.date);
  if (event.credit) {
    meta.append(' · Photos by ', creditLink(event.credit));
  }
  heading.append(title, meta);
  section.append(heading, Object.assign(document.createElement('div'), { className: 'photo-masonry' }));
  eventSections.appendChild(section);
}

function focusableInLightbox() {
  return [...lightbox.querySelectorAll('button')].filter(el => !el.disabled);
}

function openLightbox(photos, index, eventSlug) {
  activePhotos = photos;
  if (!activePhotos.length || !isPhotoUrl(activePhotos[index]?.full)) return;
  activeIndex = index;
  activeEventSlug = eventSlug;
  lastFocus = document.activeElement;
  showLightboxImage();
  updateEventSwitcher();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  pageParts.forEach(el => { if (el) el.inert = true; });
  document.body.style.overflow = 'hidden';
  document.getElementById('lbClose').focus();
}

function updateEventSwitcher() {
  lbEvents.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.slug === activeEventSlug);
  });
}

function showLightboxImage() {
  const photo = activePhotos[activeIndex];
  const event = manifest.find(item => item.slug === activeEventSlug);
  lbImage.src = photo.full;
  lbImage.alt = event ? `${event.title} photo ${activeIndex + 1}` : 'Photo';
  lbCounter.textContent = `${activeIndex + 1} / ${activePhotos.length}`;
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lbImage.src = '';
  lbImage.alt = '';
  pageParts.forEach(el => { if (el) el.inert = false; });
  document.body.style.overflow = '';
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => {
  activeIndex = (activeIndex - 1 + activePhotos.length) % activePhotos.length;
  showLightboxImage();
});
document.getElementById('lbNext').addEventListener('click', () => {
  activeIndex = (activeIndex + 1) % activePhotos.length;
  showLightboxImage();
});
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') {
    closeLightbox();
    return;
  }
  if (e.key === 'ArrowLeft') {
    document.getElementById('lbPrev').click();
    return;
  }
  if (e.key === 'ArrowRight') {
    document.getElementById('lbNext').click();
    return;
  }
  if (e.key !== 'Tab') return;
  const items = focusableInLightbox();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

fetch('/gallery-manifest.json')
  .then(res => res.json())
  .then(data => {
    manifest = data;
    const requested = hashId();

    manifest.forEach(event => {
      const link = document.createElement('a');
      link.href = `#${event.slug}`;
      link.textContent = event.title;
      link.dataset.slug = event.slug;
      eventNav.appendChild(link);
      renderEvent(event);

      const switchBtn = document.createElement('button');
      switchBtn.type = 'button';
      switchBtn.textContent = event.title;
      switchBtn.dataset.slug = event.slug;
      switchBtn.addEventListener('click', () => {
        if (event.slug !== activeEventSlug) openLightbox(event.photos, 0, event.slug);
      });
      lbEvents.appendChild(switchBtn);
    });

    const fillObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const event = manifest.find(item => item.slug === entry.target.id);
        if (event) renderPhotos(event);
        fillObserver.unobserve(entry.target);
      });
    }, { rootMargin: '700px 0px' });

    document.querySelectorAll('.event-section').forEach(section => {
      if (section.id === requested || section.id === manifest[0]?.slug) {
        const event = manifest.find(item => item.slug === section.id);
        if (event) renderPhotos(event);
      } else {
        fillObserver.observe(section);
      }
    });

    if (requested) {
      const target = document.getElementById(requested);
      if (target) target.scrollIntoView();
    }

    const navLinks = eventNav.querySelectorAll('a');
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.slug === entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.event-section').forEach(section => sectionObserver.observe(section));
  })
  .catch(() => {
    const note = document.createElement('p');
    note.className = 'event-loading';
    note.textContent = 'Photos coming soon.';
    eventSections.replaceChildren(note);
  });
