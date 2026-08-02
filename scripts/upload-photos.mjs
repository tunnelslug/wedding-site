// One-off script: uploads gallery-staging/ to Vercel Blob and writes public/gallery-manifest.json.
// Run with: node scripts/upload-photos.mjs
import { put } from '@vercel/blob';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

config({ path: join(import.meta.dirname, '..', '.env.local') });

const STAGING_ROOT = join(import.meta.dirname, '..', 'gallery-staging');
const MANIFEST_PATH = join(import.meta.dirname, '..', 'public', 'gallery-manifest.json');

const EVENTS = [
  { slug: 'engagement', title: 'Engagement Shoot', date: 'March 7', credit: '@henryliphotography' },
  { slug: 'ceremony', title: 'Wedding Ceremony', date: 'April 3', credit: '@goltsvard_photo' },
  { slug: 'reception', title: 'Wedding Reception', date: 'April 4', credit: '@ryanshiverphotography' },
  { slug: 'babyshower-la', title: 'Baby Shower — LA', date: 'April 25', credit: null },
  { slug: 'babyshower-bayarea', title: 'Baby Shower — Bay Area', date: 'June 7', credit: null },
];

async function uploadEvent(slug) {
  const thumbDir = join(STAGING_ROOT, slug, 'thumb');
  const fullDir = join(STAGING_ROOT, slug, 'full');
  const files = (await readdir(thumbDir)).filter(f => f.endsWith('.jpg')).sort();

  const photos = [];
  for (const file of files) {
    const [thumbBuf, fullBuf] = await Promise.all([
      readFile(join(thumbDir, file)),
      readFile(join(fullDir, file)),
    ]);

    const [thumbBlob, fullBlob] = await Promise.all([
      put(`gallery/${slug}/thumb/${file}`, thumbBuf, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: false, allowOverwrite: true }),
      put(`gallery/${slug}/full/${file}`, fullBuf, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: false, allowOverwrite: true }),
    ]);

    photos.push({ thumb: thumbBlob.url, full: fullBlob.url });
    process.stdout.write(`\r  ${slug}: ${photos.length}/${files.length}`);
  }
  console.log('');
  return photos;
}

const manifest = [];
for (const event of EVENTS) {
  console.log(`Uploading ${event.title}...`);
  const photos = await uploadEvent(event.slug);
  manifest.push({ ...event, count: photos.length, photos });
}

await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to ${MANIFEST_PATH}`);
