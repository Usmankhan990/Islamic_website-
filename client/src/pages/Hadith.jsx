import { useState, useEffect } from 'react';
import { COLLECTIONS, getHadithsByRange, searchHadiths } from '../services/hadithApi';

export default function Hadith() {
  const [collection, setCollection] = useState('bukhari');
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const perPage = 10;

  useEffect(() => {
    loadHadiths();
  }, [collection, page]);

  const loadHadiths = async () => {
    setLoading(true);
    setSearchResults(null);
    try {
      const data = await getHadithsByRange(collection, (page - 1) * perPage + 1, perPage);
      setHadiths(data);
    } catch { }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search.trim()) { setSearchResults(null); return; }
    setLoading(true);
    try {
      const results = await searchHadiths(collection, search);
      setSearchResults(results);
    } catch { }
    setLoading(false);
  };

  const displayHadiths = searchResults || hadiths;

  return (
    <div className="page container">
      <div className="hadith-header animate-slide-up">
        <h1 className="heading-xl">📚 Hadith Collections</h1>
        <p className="text-muted" style={{ maxWidth: 600, margin: '12px auto' }}>
          Browse authentic Hadith from six major collections — Sahih Bukhari, Sahih Muslim, and more.
        </p>
      </div>

      {/* Collection Tabs */}
      <div className="tabs" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(COLLECTIONS).map(([key, col]) => (
          <button key={key} className={`tab ${collection === key ? 'active' : ''}`} onClick={() => { setCollection(key); setPage(1); setSearchResults(null); setSearch(''); }}>
            {col.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-md" style={{ marginBottom: 24 }}>
        <input type="text" className="form-input" placeholder={`🔍 Search in ${COLLECTIONS[collection].name}...`} value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        {searchResults && <button className="btn btn-outline" onClick={() => { setSearchResults(null); setSearch(''); }}>Clear</button>}
      </div>

      {searchResults && <p className="text-muted" style={{ marginBottom: 16 }}>Found {searchResults.length} results</p>}

      {/* Hadiths */}
      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : (
        <div className="hadith-list">
          {displayHadiths.map((h, i) => (
            <div key={i} className="hadith-card card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="hadith-meta">
                <span className="badge badge-primary">#{h.hadithnumber || i + 1}</span>
                {h.grades && h.grades[0] && <span className="badge badge-accent">{h.grades[0].grade}</span>}
              </div>
              <p className="hadith-text">{h.text}</p>
            </div>
          ))}
          {displayHadiths.length === 0 && <p className="text-center text-muted" style={{ padding: 40 }}>No hadiths found. Try a different search.</p>}
        </div>
      )}

      {/* Pagination */}
      {!searchResults && (
        <div className="flex justify-center gap-md" style={{ marginTop: 32 }}>
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span className="flex items-center text-muted">Page {page}</span>
          <button className="btn btn-outline" onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <style>{`
        .hadith-header { text-align: center; margin-bottom: 32px; }
        .hadith-list { display: flex; flex-direction: column; gap: 16px; }
        .hadith-card { opacity: 0; animation: slideUp 0.4s ease forwards; }
        .hadith-meta { display: flex; gap: 8px; margin-bottom: 12px; }
        .hadith-text { color: var(--text); line-height: 1.8; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
