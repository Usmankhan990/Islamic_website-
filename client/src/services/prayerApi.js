const ALADHAN_API = 'https://api.aladhan.com/v1';

const METHODS = {
  1: 'University of Islamic Sciences, Karachi',
  2: 'Islamic Society of North America (ISNA)',
  3: 'Muslim World League',
  4: 'Umm Al-Qura University, Makkah',
  5: 'Egyptian General Authority of Survey',
  7: 'Institute of Geophysics, University of Tehran',
  8: 'Gulf Region',
  9: 'Kuwait',
  10: 'Qatar',
  11: 'Majlis Ugama Islam Singapura',
  12: 'Union Organization Islamic de France',
  13: 'Diyanet İşleri Başkanlığı, Turkey',
  15: 'Moonsighting Committee Worldwide'
};

export async function getPrayerTimes(latitude, longitude, method = 2) {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const res = await fetch(
    `${ALADHAN_API}/timings/${today}?latitude=${latitude}&longitude=${longitude}&method=${method}`
  );
  const data = await res.json();
  return data.data;
}

export async function getPrayerTimesByCity(city, country, method = 2) {
  const today = new Date().toLocaleDateString('en-CA');
  const res = await fetch(
    `${ALADHAN_API}/timingsByCity/${today}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`
  );
  const data = await res.json();
  return data.data;
}

export async function getMonthlyCalendar(latitude, longitude, year, month, method = 2) {
  const res = await fetch(
    `${ALADHAN_API}/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=${method}`
  );
  const data = await res.json();
  return data.data;
}

export async function getQiblaDirection(latitude, longitude) {
  const res = await fetch(`${ALADHAN_API}/qibla/${latitude}/${longitude}`);
  const data = await res.json();
  return data.data;
}

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function getNextPrayer(timings) {
  const now = new Date();
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  for (const prayer of prayers) {
    const [h, m] = timings[prayer].split(':').map(Number);
    const prayerTime = new Date(now);
    prayerTime.setHours(h, m, 0, 0);
    if (prayerTime > now) {
      return { name: prayer, time: timings[prayer], date: prayerTime };
    }
  }
  // After Isha, next is Fajr tomorrow
  const [h, m] = timings.Fajr.split(':').map(Number);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(h, m, 0, 0);
  return { name: 'Fajr', time: timings.Fajr, date: tomorrow };
}

export { METHODS };
