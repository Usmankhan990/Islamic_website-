const CDN_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

const COLLECTIONS = {
  'bukhari': { name: 'Sahih al-Bukhari', key: 'eng-bukhari', hadiths: 7563 },
  'muslim': { name: 'Sahih Muslim', key: 'eng-muslim', hadiths: 7563 },
  'abudawud': { name: 'Sunan Abu Dawud', key: 'eng-abudawud', hadiths: 5274 },
  'tirmidhi': { name: "Jami' at-Tirmidhi", key: 'eng-tirmidhi', hadiths: 3956 },
  'ibnmajah': { name: 'Sunan Ibn Majah', key: 'eng-ibnmajah', hadiths: 4341 },
  'nasai': { name: "Sunan an-Nasa'i", key: 'eng-nasai', hadiths: 5758 }
};

// Cache for loaded collections
const cache = {};

export async function getCollection(collectionKey) {
  if (cache[collectionKey]) return cache[collectionKey];
  
  const col = COLLECTIONS[collectionKey];
  if (!col) throw new Error(`Unknown collection: ${collectionKey}`);
  
  try {
    const res = await fetch(`${CDN_BASE}/editions/${col.key}.json`);
    const data = await res.json();
    cache[collectionKey] = data;
    return data;
  } catch (error) {
    console.error(`Failed to load ${collectionKey}:`, error);
    // Return minimal structure
    return { metadata: { name: col.name }, hadiths: [] };
  }
}

export async function getHadithsByRange(collectionKey, start = 1, count = 20) {
  const data = await getCollection(collectionKey);
  const hadiths = data.hadiths || [];
  return hadiths.slice(start - 1, start - 1 + count);
}

export async function searchHadiths(collectionKey, query) {
  const data = await getCollection(collectionKey);
  const hadiths = data.hadiths || [];
  const q = query.toLowerCase();
  return hadiths.filter(h => 
    (h.text && h.text.toLowerCase().includes(q)) || 
    (h.grades && JSON.stringify(h.grades).toLowerCase().includes(q))
  ).slice(0, 50);
}

export { COLLECTIONS };
