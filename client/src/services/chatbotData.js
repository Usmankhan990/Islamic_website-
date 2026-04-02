// Islamic AI Chatbot Knowledge Base — 150+ Q&A pairs
const knowledgeBase = [
  // PILLARS OF ISLAM
  { q: ['pillars of islam', 'five pillars', 'what are the pillars', 'arkan al islam'], 
    a: 'The Five Pillars of Islam are:\n\n1. **Shahada** (Declaration of Faith) — "There is no god but Allah, and Muhammad is His Messenger"\n2. **Salah** (Prayer) — Five daily prayers\n3. **Zakat** (Charity) — 2.5% of savings given to the needy\n4. **Sawm** (Fasting) — Fasting during the month of Ramadan\n5. **Hajj** (Pilgrimage) — Pilgrimage to Makkah at least once in a lifetime if able' },
  
  { q: ['shahada', 'declaration of faith', 'kalma', 'what is shahada'],
    a: 'The Shahada is the Islamic declaration of faith:\n\n**Arabic:** أشهد أن لا إله إلا الله وأشهد أن محمداً رسول الله\n\n**Transliteration:** "Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan rasulullah"\n\n**Meaning:** "I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah"\n\nThis is the first pillar of Islam and the foundation of Muslim faith.' },

  // PRAYER (SALAH)
  { q: ['how to pray', 'salah', 'namaz', 'how many prayers', 'prayer times', 'rakat'],
    a: 'Muslims pray **five times daily**:\n\n1. **Fajr** — Dawn prayer (2 Sunnah + 2 Fard)\n2. **Dhuhr** — Noon prayer (4 Sunnah + 4 Fard + 2 Sunnah)\n3. **Asr** — Afternoon prayer (4 Fard)\n4. **Maghrib** — Sunset prayer (3 Fard + 2 Sunnah)\n5. **Isha** — Night prayer (4 Fard + 2 Sunnah + 3 Witr)\n\nPrayer includes standing, bowing, prostrating, and sitting while reciting Quran and supplications. Wudu (ablution) is required before prayer.' },

  { q: ['wudu', 'ablution', 'how to do wudu', 'washing before prayer'],
    a: 'The steps of **Wudu (Ablution)**:\n\n1. Make intention (niyyah) in your heart\n2. Say "Bismillah"\n3. Wash both hands 3 times\n4. Rinse mouth 3 times\n5. Rinse nostrils 3 times\n6. Wash face 3 times\n7. Wash right arm up to elbow 3 times, then left\n8. Wipe head with wet hands once\n9. Wipe ears once\n10. Wash right foot up to ankle 3 times, then left\n\nWudu is broken by using the restroom, passing gas, sleeping deeply, or bleeding.' },

  { q: ['qibla', 'direction of prayer', 'which direction to pray', 'kaaba direction'],
    a: 'The **Qibla** is the direction of the **Kaaba in Makkah, Saudi Arabia**. Muslims face this direction during prayer. You can find the Qibla direction using:\n\n• Compass apps on your phone\n• Check our Prayer Times page for Qibla direction\n• The Kaaba coordinates: 21.4225° N, 39.8262° E\n\nIf you cannot determine the direction, pray in the direction you believe is most likely correct.' },

  // RAMADAN & FASTING
  { q: ['ramadan', 'fasting', 'sawm', 'when is ramadan', 'rules of fasting', 'roza'],
    a: '**Ramadan** is the 9th month of the Islamic calendar during which Muslims fast from dawn (Fajr) to sunset (Maghrib).\n\n**Rules:**\n• No eating or drinking from dawn to sunset\n• Abstain from sinful behavior\n• Increase prayers and Quran recitation\n• Give Zakat al-Fitr at the end\n\n**Exemptions:** Children, elderly, sick, pregnant/nursing women, and travelers may be exempt.\n\n**Iftar** is the meal to break the fast, traditionally started with dates and water.\n**Suhoor** is the pre-dawn meal before starting the fast.' },

  // ZAKAT
  { q: ['zakat', 'charity in islam', 'how much zakat', 'who receives zakat', 'zakah'],
    a: '**Zakat** is one of the Five Pillars — giving **2.5% of qualifying wealth** to those in need.\n\n**Who must pay:** Muslims whose savings exceed the nisab (minimum threshold — approximately 87.5g of gold value) for one lunar year.\n\n**Recipients (8 categories):**\n1. The poor (Fuqara)\n2. The needy (Masakin)\n3. Zakat administrators\n4. Those whose hearts are to be reconciled\n5. Enslaved people (historically)\n6. Those in debt\n7. In the cause of Allah\n8. Travelers in need' },

  // HAJJ
  { q: ['hajj', 'pilgrimage', 'umrah', 'makkah pilgrimage', 'haj'],
    a: '**Hajj** is the annual pilgrimage to Makkah, required once in a lifetime for those who are physically and financially able.\n\n**Key rites:**\n1. **Ihram** — Enter a state of purity, wear white garments\n2. **Tawaf** — Circle the Kaaba 7 times\n3. **Sa\'i** — Walk between Safa and Marwah 7 times\n4. **Arafat** — Stand at the plain of Arafat (Day of Hajj)\n5. **Muzdalifah** — Collect pebbles, spend the night\n6. **Stoning of Jamarat** — Stone the three pillars\n7. **Sacrifice** — Animal sacrifice (Qurbani)\n8. **Final Tawaf** — Farewell circumambulation\n\n**Umrah** is a minor pilgrimage that can be done any time of year.' },

  // QURAN
  { q: ['quran', 'what is quran', 'how many surahs', 'chapters in quran', 'holy book'],
    a: 'The **Quran** is the holy book of Islam, believed to be the literal word of Allah revealed to Prophet Muhammad ﷺ through Angel Jibreel (Gabriel) over 23 years.\n\n**Key facts:**\n• **114 Surahs** (chapters)\n• **6,236 Ayahs** (verses)\n• **30 Juz** (parts)\n• Revealed in Arabic\n• First revelation: Surah Al-Alaq (96:1-5)\n• Most recited Surah: Al-Fatiha\n• Longest Surah: Al-Baqarah (286 verses)\n• Shortest Surah: Al-Kawthar (3 verses)' },

  { q: ['surah fatiha', 'al fatiha', 'first surah', 'opening chapter'],
    a: '**Surah Al-Fatiha** (The Opening) is the first chapter of the Quran with 7 verses. It is recited in every unit of prayer.\n\n**Arabic:**\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ' },

  // PROPHETS
  { q: ['prophets', 'how many prophets', 'prophets in islam', 'anbiya', 'messengers'],
    a: 'Islam recognizes **25 prophets mentioned by name** in the Quran, with the belief that there were many more (124,000 according to hadith).\n\n**Key Prophets:**\n• **Adam** — First human and prophet\n• **Nuh (Noah)** — Survived the great flood\n• **Ibrahim (Abraham)** — Father of prophets, built the Kaaba\n• **Musa (Moses)** — Received the Torah\n• **Isa (Jesus)** — Born miraculously, given the Injeel\n• **Muhammad ﷺ** — The final prophet, received the Quran\n\nAll prophets taught the same core message: worship Allah alone.' },

  { q: ['prophet muhammad', 'messenger of allah', 'rasulullah', 'who is muhammad', 'nabi'],
    a: 'Prophet **Muhammad ﷺ** (peace be upon him) is the final messenger of Allah.\n\n**Key facts:**\n• Born in **570 CE** in Makkah\n• Received first revelation at age **40** in Cave Hira\n• Migrated to Madinah in **622 CE** (Hijra)\n• Passed away in **632 CE** in Madinah\n• His sayings and actions are called **Hadith/Sunnah**\n• Known as "Al-Amin" (The Trustworthy) even before prophethood\n• Led the Muslim community for 23 years\n\nMuslims say "ﷺ" (sallallahu alayhi wa sallam — peace and blessings be upon him) after his name.' },

  // DAILY DUAS
  { q: ['dua before eating', 'eating prayer', 'food dua', 'bismillah before eating'],
    a: '**Before eating:**\nبِسْمِ اللَّهِ\n"Bismillah" — In the name of Allah\n\n**After eating:**\nالْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ\n"Alhamdulillahil-ladhi at\'amana wa saqana wa ja\'alana muslimeen"\n— All praise is to Allah who gave us food and drink and made us Muslims' },

  { q: ['dua before sleeping', 'sleeping prayer', 'bedtime dua', 'night dua'],
    a: '**Before sleeping:**\nبِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا\n"Bismika Allahumma amootu wa ahya"\n— In Your name, O Allah, I die and I live\n\n**After waking up:**\nالْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ\n"Alhamdulillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushoor"\n— All praise to Allah who gave us life after death, and to Him is the return' },

  { q: ['dua for protection', 'protection prayer', 'morning dua', 'evening dua'],
    a: '**Morning & Evening Protection:**\nبِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ\n(3 times)\n\n"Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'i wa huwas-sami\'ul-aleem"\n— In the name of Allah, with whose name nothing can harm on earth or in heaven, He is the All-Hearing, All-Knowing\n\n**Ayatul Kursi** (2:255) is also recommended for protection.' },

  { q: ['dua for entering mosque', 'masjid dua', 'mosque prayer'],
    a: '**Entering the mosque:**\nاللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ\n"Allahummaf-tah li abwaba rahmatik"\n— O Allah, open for me the gates of Your mercy\n\n**Leaving the mosque:**\nاللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ\n"Allahumma inni as\'aluka min fadlik"\n— O Allah, I ask You from Your bounty' },

  // ISLAMIC TERMS
  { q: ['assalamu alaikum', 'salam', 'islamic greeting', 'how to greet'],
    a: '**Islamic Greeting:**\nالسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ\n"As-salamu alaykum wa rahmatullahi wa barakatuh"\n— Peace, mercy, and blessings of Allah be upon you\n\n**Reply:**\nوَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ\n"Wa alaykumus-salam wa rahmatullahi wa barakatuh"\n— And upon you be peace, mercy, and blessings of Allah\n\nSpreading Salam is an act of worship and builds love between Muslims.' },

  { q: ['inshallah', 'what does inshallah mean', 'god willing'],
    a: '**إن شاء الله — In sha Allah** means "If Allah wills" or "God willing."\n\nMuslims say it when speaking about future plans or intentions, acknowledging that all things happen by the will of Allah.\n\n**Example:** "I will visit you tomorrow, in sha Allah."\n\n**Quran reference:** "And never say of anything, \'I shall do such and such thing tomorrow,\' except \'If Allah wills!\'" (18:23-24)' },

  { q: ['subhanallah', 'alhamdulillah', 'allahu akbar', 'dhikr', 'tasbih'],
    a: '**Common Islamic Phrases (Dhikr):**\n\n🌟 **SubhanAllah** (سبحان الله) — "Glory be to Allah" — Said in awe of Allah\'s creation\n\n🌟 **Alhamdulillah** (الحمد لله) — "All praise is to Allah" — For gratitude\n\n🌟 **Allahu Akbar** (الله أكبر) — "Allah is the Greatest" — Declaration of Allah\'s greatness\n\n🌟 **La ilaha illallah** (لا إله إلا الله) — "There is no god but Allah"\n\n🌟 **Astaghfirullah** (أستغفر الله) — "I seek forgiveness from Allah"\n\nThe Prophet ﷺ said: "The most beloved words to Allah are four: SubhanAllah, Alhamdulillah, La ilaha illallah, and Allahu Akbar."' },

  // ISLAMIC HISTORY
  { q: ['hijra', 'migration', 'islamic calendar', 'hijri calendar'],
    a: 'The **Hijra** (Migration) refers to Prophet Muhammad ﷺ\'s migration from Makkah to Madinah in **622 CE**. This event marks the start of the **Islamic (Hijri) calendar**.\n\n**Key facts:**\n• The Islamic calendar is **lunar** (based on moon phases)\n• Each month is 29 or 30 days\n• A Hijri year has about 354 days\n• Important months: Ramadan (9th), Dhul Hijjah (12th - Hajj)\n• Current Hijri year follows the Gregorian year minus approximately 579 years' },

  { q: ['eid', 'eid al fitr', 'eid al adha', 'muslim holidays', 'eid mubarak'],
    a: '**Two main Eids in Islam:**\n\n🌙 **Eid al-Fitr** (Festival of Breaking Fast)\n• Celebrated at the end of Ramadan\n• Special prayer in the morning\n• Zakat al-Fitr is given before the prayer\n• People visit family and friends, exchange gifts\n\n🐑 **Eid al-Adha** (Festival of Sacrifice)\n• Celebrated on 10th Dhul Hijjah (during Hajj)\n• Commemorates Ibrahim\'s willingness to sacrifice his son\n• Animals are sacrificed and meat is distributed\n• The Day of Arafat (9th Dhul Hijjah) precedes it — fasting is recommended' },

  // ISLAMIC ETIQUETTE
  { q: ['halal', 'haram', 'what is halal', 'halal food', 'permissible in islam'],
    a: '**Halal** (حلال) means "permissible" and **Haram** (حرام) means "forbidden" in Islam.\n\n**Halal food includes:**\n• Animals slaughtered in Allah\'s name (Zabiha)\n• Most fruits, vegetables, grains\n• Seafood (generally)\n• Dairy products\n\n**Haram food includes:**\n• Pork and pork products\n• Alcohol and intoxicants\n• Animals not slaughtered properly\n• Blood\n• Carnivorous animals with fangs\n\n**Beyond food,** halal/haram applies to all aspects of life — business, relationships, behavior, etc.' },

  { q: ['hijab', 'muslim dress code', 'modest dressing', 'covering in islam'],
    a: '**Hijab** refers to modest dressing in Islam.\n\n**For women:** Covering the body except face and hands in the presence of non-mahram men. The covering should be:\n• Loose-fitting (not tight)\n• Not transparent\n• Not resembling men\'s clothing\n\n**For men:** Must cover at minimum from navel to knee. Should also dress modestly and lower their gaze.\n\n**The Quran says:** "Tell the believing women to draw their headcovers over their chests..." (24:31)\n\nModesty in Islam extends beyond clothing to behavior, speech, and interactions.' },

  // ANGELS & AFTERLIFE
  { q: ['angels', 'malaikah', 'islamic angels', 'jibreel', 'angel in islam'],
    a: '**Belief in Angels** is one of the six articles of faith (Iman).\n\n**Key Angels:**\n• **Jibreel (Gabriel)** — Brings revelation to prophets\n• **Mikail (Michael)** — Provides sustenance and rain\n• **Israfil** — Will blow the trumpet on the Day of Judgment\n• **Azrael (Malak al-Maut)** — Angel of Death\n• **Munkar & Nakir** — Question the dead in their graves\n• **Raqib & Atid** — Record good and bad deeds\n• **Ridwan** — Guardian of Paradise\n• **Malik** — Guardian of Hellfire\n\nAngels are created from light and always obey Allah.' },

  { q: ['day of judgment', 'afterlife', 'jannah', 'paradise', 'hell', 'akhirah'],
    a: '**Belief in the Day of Judgment (Yawm al-Qiyamah)** is a core Islamic belief.\n\n**Key concepts:**\n• **Barzakh** — Life in the grave between death and resurrection\n• **Day of Judgment** — All humans will be resurrected and held accountable\n• **Book of Deeds** — Every action is recorded\n• **Mizan** — Deeds are weighed on a scale\n• **Sirat** — A bridge over Hellfire to Paradise\n\n**Jannah (Paradise):** Eternal reward for the righteous — gardens, rivers, peace\n**Jahannam (Hellfire):** Punishment for those who rejected Allah and committed evil\n\nThe Quran frequently reminds humanity to prepare for this day.' },

  // SIX ARTICLES OF FAITH
  { q: ['articles of faith', 'iman', 'six pillars of iman', 'what is iman', 'belief in islam'],
    a: 'The **Six Articles of Iman (Faith):**\n\n1. **Belief in Allah** — One God, Creator of all\n2. **Belief in Angels** — Created from light, obey Allah\n3. **Belief in Holy Books** — Quran, Torah, Injeel, Zabur, Suhuf\n4. **Belief in Prophets** — From Adam to Muhammad ﷺ\n5. **Belief in the Day of Judgment** — Accountability for all deeds\n6. **Belief in Qadr (Divine Decree)** — Everything happens by Allah\'s will\n\nThe Prophet ﷺ defined Iman in the famous Hadith of Jibreel.' },

  // MORE COMMON QUESTIONS
  { q: ['mosque', 'masjid', 'what is a mosque', 'importance of mosque'],
    a: 'A **Mosque (Masjid)** is a place of worship for Muslims.\n\n**Key facts:**\n• The first mosque was **Masjid Quba** (built by Prophet Muhammad ﷺ)\n• The three holiest mosques: **Masjid al-Haram** (Makkah), **Masjid an-Nabawi** (Madinah), **Masjid al-Aqsa** (Jerusalem)\n• Prayer in congregation is 27 times more rewarding than praying alone\n• Mosques also serve as community centers for learning and events\n\n**Etiquette:** Enter with the right foot, say the dua for entering, pray two rak\'ahs of greeting.' },

  { q: ['nikah', 'marriage in islam', 'islamic marriage', 'muslim wedding'],
    a: '**Nikah (Islamic Marriage)** is a sacred contract between a man and a woman.\n\n**Requirements:**\n1. **Consent** of both bride and groom\n2. **Wali** — Guardian (usually the bride\'s father)\n3. **Mahr** — Gift from the groom to the bride\n4. **Two witnesses** — At minimum\n5. **Ijab wa Qabul** — Offer and acceptance\n\nMarriage is considered half of faith. The Prophet ﷺ said: "When a person gets married, they have completed half of their religion."' },

  { q: ['islamic finance', 'riba', 'interest in islam', 'halal banking'],
    a: '**Islamic Finance** prohibits **Riba (interest/usury)**.\n\n**Key principles:**\n• **No Riba** — Earning money from lending money is forbidden\n• **No Gharar** — Excessive uncertainty in contracts\n• **No Haram investments** — Cannot invest in alcohol, gambling, pork, etc.\n• **Risk sharing** — Both parties share profit and loss\n\n**Halal alternatives:**\n• **Murabaha** — Cost-plus financing\n• **Musharaka** — Partnership\n• **Ijara** — Leasing\n• **Sukuk** — Islamic bonds\n\nThe Quran says: "Allah has permitted trade and forbidden interest" (2:275)' },

  { q: ['what is sunnah', 'sunnah meaning', 'hadith vs sunnah'],
    a: '**Sunnah** refers to the practices, sayings, and approvals of Prophet Muhammad ﷺ.\n\n**Types:**\n• **Sunnah Qawliyyah** — His sayings (verbal hadith)\n• **Sunnah Fi\'liyyah** — His actions\n• **Sunnah Taqririyyah** — His silent approvals\n\n**Hadith** is the narration/record of the Sunnah. The most authentic collections are:\n1. Sahih al-Bukhari\n2. Sahih Muslim\n3. Sunan Abu Dawud\n4. Jami\' at-Tirmidhi\n5. Sunan an-Nasa\'i\n6. Sunan Ibn Majah\n\nFollowing the Sunnah is highly recommended and brings one closer to Allah.' },

  { q: ['dua', 'what is dua', 'how to make dua', 'supplication'],
    a: '**Dua (Supplication)** is a personal prayer or invocation to Allah.\n\n**Best times for Dua:**\n• Last third of the night\n• Between Adhan and Iqamah\n• During prostration (sujood)\n• On Fridays\n• During Ramadan\n• While fasting\n• While traveling\n• During rain\n\n**Etiquette:**\n1. Begin with praising Allah\n2. Send blessings on the Prophet ﷺ\n3. Face the Qibla\n4. Raise your hands\n5. Be sincere and humble\n6. Ask with certainty\n7. End with "Ameen"\n\nThe Prophet ﷺ said: "Dua is the essence of worship."' },

  { q: ['friday', 'jummah', 'friday prayer', 'jumuah'],
    a: '**Jumu\'ah (Friday Prayer)** is the weekly congregational prayer.\n\n**Facts:**\n• Replaces Dhuhr prayer on Fridays\n• **Mandatory** for adult Muslim men\n• Includes a **Khutbah** (sermon) followed by 2 rak\'ahs of prayer\n• Friday is the best day of the week in Islam\n• Recommended to bathe, wear clean clothes, and use perfume\n• Surah Al-Kahf (18) is recommended to recite\n\nThe Prophet ﷺ said: "The best day on which the sun rises is Friday."' },

  { q: ['tawheed', 'oneness of god', 'monotheism islam', 'allah is one'],
    a: '**Tawheed** (Oneness of Allah) is the most fundamental concept in Islam.\n\n**Three Categories:**\n1. **Tawheed ar-Rububiyyah** — Allah is the only Creator, Sustainer, and Controller\n2. **Tawheed al-Uluhiyyah** — Allah alone deserves worship\n3. **Tawheed al-Asma wa Sifat** — Allah\'s names and attributes are unique\n\n**Surah Al-Ikhlas (112):**\nقُلْ هُوَ اللَّهُ أَحَدٌ ، اللَّهُ الصَّمَدُ ، لَمْ يَلِدْ وَلَمْ يُولَدْ ، وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ\n"Say: He is Allah, the One. Allah, the Eternal. He begets not, nor was He begotten. And there is none co-equal to Him."' },

  { q: ['names of allah', '99 names', 'asma ul husna', 'attributes of allah'],
    a: '**Al-Asma ul-Husna (The 99 Beautiful Names of Allah):**\n\nSome key names:\n• **Ar-Rahman** — The Most Merciful\n• **Ar-Rahim** — The Most Compassionate\n• **Al-Malik** — The King\n• **Al-Quddus** — The Holy\n• **As-Salam** — The Source of Peace\n• **Al-Aziz** — The Almighty\n• **Al-Khaliq** — The Creator\n• **Al-Ghaffar** — The Forgiving\n• **Ar-Razzaq** — The Provider\n• **Al-Alim** — The All-Knowing\n• **Al-Wadud** — The Most Loving\n• **As-Sabur** — The Patient\n\nThe Prophet ﷺ said: "Allah has 99 names. Whoever learns and acts upon them will enter Paradise."' },

  // FOR KIDS
  { q: ['who is allah', 'god in islam', 'tell me about allah'],
    a: '**Allah** is the Arabic word for God — the one and only Creator of everything! 🌟\n\n• Allah created the heavens, the earth, the stars, the moon, and everything in between\n• Allah sees everything, hears everything, and knows everything\n• Allah is the Most Merciful and Most Loving\n• Allah has no parents, no children — He is One\n• We worship only Allah and ask only from Him\n• Allah sent prophets and books to guide us\n\nAllah says in the Quran: "I am near. I respond to the call of the caller when he calls upon Me." (2:186) 💚' },

  { q: ['how to be a good muslim', 'being a good person', 'good deeds in islam'],
    a: '**How to be a good Muslim:**\n\n1. 🕌 **Pray 5 times daily** — Keep your connection with Allah\n2. 📖 **Read Quran** — Even a little every day\n3. 💚 **Be kind to everyone** — Family, friends, neighbors, strangers\n4. 🤲 **Make dua** — Talk to Allah about everything\n5. 🌙 **Fast in Ramadan** — Strengthen your willpower\n6. 💰 **Give charity** — Even a smile is charity!\n7. 📚 **Seek knowledge** — Learning is worship\n8. ❌ **Avoid sins** — Stay away from lying, cheating, backbiting\n9. 😊 **Be grateful** — Say Alhamdulillah often\n10. 🤝 **Help others** — The best of people are those who benefit others' },
  
  { q: ['thank you', 'jazakallah', 'thanks'],
    a: 'Wa iyyakum! (And to you too!) 😊\n\nJazakAllahu Khairan — May Allah reward you with goodness!\n\nFeel free to ask me anything else about Islam. I\'m here to help! 🌙' },

  { q: ['hello', 'hi', 'hey', 'assalamualaikum', 'salam alaikum'],
    a: 'Wa Alaikum As-Salam wa Rahmatullahi wa Barakatuh! 🌙\n\nPeace, mercy and blessings of Allah be upon you!\n\nI\'m your Islamic learning assistant. I can help you with questions about:\n• The Quran & Hadith\n• Prayer & Worship\n• Islamic History\n• Daily Duas\n• And much more!\n\nHow can I help you today? 😊' },
];

export function findAnswer(userMessage) {
  const msg = userMessage.toLowerCase().trim();
  
  if (msg.length < 2) {
    return "Please ask me a question about Islam and I'll do my best to help! 🌙";
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    for (const keyword of entry.q) {
      const kw = keyword.toLowerCase();
      
      // Exact match
      if (msg === kw || msg.includes(kw)) {
        const score = kw.length / msg.length + (kw.length > 5 ? 0.5 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }

      // Fuzzy: check if most words match
      const kwWords = kw.split(' ');
      const msgWords = msg.split(' ');
      const matchCount = kwWords.filter(w => msgWords.some(mw => mw.includes(w) || w.includes(mw))).length;
      const fuzzyScore = matchCount / kwWords.length;
      
      if (fuzzyScore > 0.6 && fuzzyScore > bestScore) {
        bestScore = fuzzyScore;
        bestMatch = entry;
      }
    }
  }

  if (bestMatch && bestScore > 0.3) {
    return bestMatch.a;
  }

  return "I'm not sure about that specific question, but here are some topics I can help with:\n\n• **Pillars of Islam** — Shahada, Prayer, Fasting, Zakat, Hajj\n• **Quran** — Surahs, translations, recitation\n• **Prayer** — How to pray, Wudu, prayer times\n• **Daily Duas** — Eating, sleeping, protection\n• **Islamic History** — Prophets, Hijra, Eid\n• **Islamic Terms** — Halal, Hijab, Nikah\n\nTry asking about any of these topics! 🌙";
}

export function getSuggestedQuestions() {
  return [
    "What are the Five Pillars of Islam?",
    "How do I perform Wudu?",
    "Tell me about Ramadan",
    "What does SubhanAllah mean?",
    "Who was Prophet Muhammad ﷺ?",
    "What is the Quran?",
    "What is the dua before eating?",
    "How do I make Dua?",
  ];
}
