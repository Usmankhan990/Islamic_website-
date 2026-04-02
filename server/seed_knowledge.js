const mysql = require('mysql2/promise');

async function seed() {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'islamic_platform' });

  const entries = [
    ['hadith', 'The Prophet (ﷺ) said: "The best among you is the one who learns the Quran and teaches it." (Sahih al-Bukhari 5027)', 'Sahih al-Bukhari', 'quran learn teach best'],
    ['hadith', 'The Prophet (ﷺ) said: "None of you truly believes until he loves for his brother what he loves for himself." (Sahih al-Bukhari 13)', 'Sahih al-Bukhari', 'believe brother love faith'],
    ['hadith', 'The Prophet (ﷺ) said: "The strong man is not the one who can overpower others, but the one who controls himself when angry." (Sahih al-Bukhari 6114)', 'Sahih al-Bukhari', 'anger strong control patience'],
    ['hadith', 'The Prophet (ﷺ) said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent." (Sahih al-Bukhari 6018)', 'Sahih al-Bukhari', 'silence speech good believe last day'],
    ['hadith', 'The Prophet (ﷺ) said: "Make things easy and do not make them difficult, cheer the people up by conveying glad tidings and do not repulse them." (Sahih al-Bukhari 69)', 'Sahih al-Bukhari', 'easy difficult glad tidings kindness'],
    ['hadith', 'The Prophet (ﷺ) said: "The most beloved deed to Allah is the most regular and constant even if it were little." (Sahih al-Bukhari 6464)', 'Sahih al-Bukhari', 'deed regular constant worship consistency'],
    ['hadith', 'The Prophet (ﷺ) said: "Cleanliness is half of faith." (Sahih Muslim 223)', 'Sahih Muslim', 'clean faith hygiene wudu purity'],
    ['hadith', 'The Prophet (ﷺ) said: "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise." (Sahih Muslim 2699)', 'Sahih Muslim', 'knowledge learn paradise path education'],
    ['hadith', 'The Prophet (ﷺ) said: "The best of you are those who are best to their families." (Sunan at-Tirmidhi 3895)', 'Sunan at-Tirmidhi', 'family wife husband best character'],
    ['hadith', 'The Prophet (ﷺ) said: "Smiling in the face of your brother is charity." (Sunan at-Tirmidhi 1956)', 'Sunan at-Tirmidhi', 'smile charity brother kindness sadaqah'],
    ['hadith', 'The Prophet (ﷺ) said: "Do not be angry." He repeated it several times. (Sahih al-Bukhari 6116)', 'Sahih al-Bukhari', 'angry anger patience calm'],
    ['hadith', 'The Prophet (ﷺ) said: "Whoever is not grateful to the people is not grateful to Allah." (Sunan Abu Dawud 4811)', 'Sunan Abu Dawud', 'grateful thankful shukr gratitude people'],
    ['general', 'The Five Pillars of Islam are: 1. Shahada (Declaration of Faith), 2. Salah (Prayer - 5 daily), 3. Zakat (Charity - 2.5%), 4. Sawm (Fasting in Ramadan), 5. Hajj (Pilgrimage to Mecca).', 'Islamic Fundamentals', 'pillars islam five shahada salah zakat sawm hajj prayer fasting'],
    ['general', 'Wudu steps: 1. Intention, 2. Wash hands 3x, 3. Rinse mouth 3x, 4. Clean nose 3x, 5. Wash face 3x, 6. Wash arms to elbows 3x, 7. Wipe head, 8. Wash feet to ankles 3x.', 'Islamic Jurisprudence', 'wudu ablution wash prayer clean how'],
    ['general', 'Six articles of faith: 1. Belief in Allah, 2. Belief in Angels, 3. Belief in Holy Books, 4. Belief in Prophets, 5. Belief in Day of Judgment, 6. Belief in Divine Decree.', 'Islamic Fundamentals', 'faith belief articles iman angels prophets decree qadr'],
    ['general', 'How to pray Salah: 1. Stand facing Qibla, 2. Raise hands and say Allahu Akbar, 3. Recite Al-Fatiha, 4. Bow (Ruku), 5. Stand up, 6. Prostrate (Sujud), 7. Sit, 8. Prostrate again, then repeat for each rakah.', 'Islamic Jurisprudence', 'pray salah how prayer rakat steps namaz'],
    ['general', 'Ramadan is the 9th month of the Islamic calendar. Muslims fast from dawn to sunset. It commemorates the first revelation of the Quran to Prophet Muhammad (ﷺ). Laylatul Qadr (Night of Power) occurs in the last 10 nights.', 'Islamic Calendar', 'ramadan fasting month qadr night power'],
    ['dua', 'Dua before eating: Bismillahi wa ala barakatillah. After eating: Alhamdulillahil-lathee at amana wa saqana wa ja alana muslimeen.', 'Daily Duas', 'eat food dua before after bismillah'],
    ['dua', 'Dua for knowledge: Rabbi zidnee ilma (O my Lord, increase me in knowledge) - Quran 20:114.', 'Quran', 'knowledge study learn dua ilm'],
    ['dua', 'Dua entering masjid: Allahumma-ftah lee abwaba rahmatik. Leaving: Allahumma inni as aluka min fadlik.', 'Daily Duas', 'masjid mosque enter leave dua'],
    ['dua', 'Dua for protection: Bismillahil-lathee la yadurru ma asmihi shaiyun fil-ardi wa la fis-samaai wa Huwas-Samee ul-Aleem (In the name of Allah with whose name nothing can harm in the earth nor in heaven).', 'Daily Duas', 'protection harm safe morning evening dua'],
    ['quran', 'Surah Al-Fatiha is the opening chapter of the Quran and is recited in every unit (rakah) of prayer. It contains 7 verses and is known as "The Mother of the Book" (Umm al-Kitab).', 'Quran', 'fatiha opening prayer surah first mother book'],
    ['quran', 'Ayatul Kursi (Quran 2:255) is known as the Verse of the Throne. The Prophet (ﷺ) said it is the greatest verse in the Quran and provides protection when recited before sleeping.', 'Quran 2:255', 'ayatul kursi throne verse protection sleep greatest'],
    ['quran', 'Surah Al-Ikhlas (Chapter 112) equals one-third of the Quran in reward. It declares pure monotheism: "Say: He is Allah, the One."', 'Quran', 'ikhlas monotheism tawhid one third surah reward'],
    ['fiqh', 'The four major schools of Islamic jurisprudence (madhabs) are: 1. Hanafi (Imam Abu Hanifa), 2. Maliki (Imam Malik), 3. Shafii (Imam Shafii), 4. Hanbali (Imam Ahmad ibn Hanbal).', 'Islamic Jurisprudence', 'madhab school fiqh hanafi maliki shafii hanbali jurisprudence'],
    ['fiqh', 'Zakat is obligatory on savings that exceed the Nisab threshold (equivalent to 85g gold or 595g silver) held for one lunar year. The rate is 2.5% of eligible wealth.', 'Islamic Finance', 'zakat charity obligatory nisab gold silver rate percent']
  ];

  for (const [cat, ans, src, kw] of entries) {
    await db.query('INSERT INTO ai_knowledge_base (category, answer, source, keywords) VALUES (?,?,?,?)', [cat, ans, src, kw]);
  }

  console.log(`Seeded ${entries.length} knowledge base entries`);
  await db.end();
}

seed().catch(console.error);
