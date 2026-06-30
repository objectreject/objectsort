// ── STATE ──
const LASTFM_API_KEY = 'd76a3e138b7658d964689fd90d52f86d';
let CLIENT_ID = '';
let ACCESS_TOKEN = '';
let tracks = [];
let genres = [];
let tags = {};
let genreMappings = {};
let trackMeta = {}; // { trackId: { countries: [], year } }
let flagged = new Set();
let removedIds = new Set();
let unavailableIds = new Set(); // is_playable === false
let takenDownIds = new Set();   // item.track === null
let artistGenreCache = {};
let tempoCache = {};

const COUNTRIES = ['Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Cape Verde','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominican Republic','DR Congo','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','unknown'];

const CONTINENT_MAP = {
  'Afghanistan':'Asia','Albania':'Europe','Algeria':'Africa','Andorra':'Europe','Angola':'Africa',
  'Argentina':'South America','Armenia':'Asia','Australia':'Oceania','Austria':'Europe','Azerbaijan':'Asia',
  'Bahamas':'North America','Bahrain':'Asia','Bangladesh':'Asia','Belarus':'Europe','Belgium':'Europe',
  'Belize':'North America','Benin':'Africa','Bhutan':'Asia','Bolivia':'South America','Bosnia and Herzegovina':'Europe',
  'Botswana':'Africa','Brazil':'South America','Brunei':'Asia','Bulgaria':'Europe','Burkina Faso':'Africa',
  'Burundi':'Africa','Cambodia':'Asia','Cameroon':'Africa','Canada':'North America','Cape Verde':'Africa',
  'Central African Republic':'Africa','Chad':'Africa','Chile':'South America','China':'Asia',
  'Colombia':'South America','Comoros':'Africa','Congo':'Africa','Costa Rica':'North America','Croatia':'Europe',
  'Cuba':'North America','Cyprus':'Europe','Czech Republic':'Europe','Denmark':'Europe','Djibouti':'Africa',
  'Dominican Republic':'North America','DR Congo':'Africa','Ecuador':'South America','Egypt':'Africa',
  'El Salvador':'North America','Equatorial Guinea':'Africa','Eritrea':'Africa','Estonia':'Europe',
  'Eswatini':'Africa','Ethiopia':'Africa','Fiji':'Oceania','Finland':'Europe','France':'Europe',
  'Gabon':'Africa','Gambia':'Africa','Georgia':'Asia','Germany':'Europe','Ghana':'Africa','Greece':'Europe',
  'Guatemala':'North America','Guinea':'Africa','Guinea-Bissau':'Africa','Guyana':'South America',
  'Haiti':'North America','Honduras':'North America','Hungary':'Europe','Iceland':'Europe','India':'Asia',
  'Indonesia':'Asia','Iran':'Asia','Iraq':'Asia','Ireland':'Europe','Israel':'Asia','Italy':'Europe',
  'Ivory Coast':'Africa','Jamaica':'North America','Japan':'Asia','Jordan':'Asia','Kazakhstan':'Asia',
  'Kenya':'Africa','Kosovo':'Europe','Kuwait':'Asia','Kyrgyzstan':'Asia','Laos':'Asia','Latvia':'Europe',
  'Lebanon':'Asia','Lesotho':'Africa','Liberia':'Africa','Libya':'Africa','Liechtenstein':'Europe',
  'Lithuania':'Europe','Luxembourg':'Europe','Madagascar':'Africa','Malawi':'Africa','Malaysia':'Asia',
  'Maldives':'Asia','Mali':'Africa','Malta':'Europe','Mauritania':'Africa','Mauritius':'Africa',
  'Mexico':'North America','Moldova':'Europe','Monaco':'Europe','Mongolia':'Asia','Montenegro':'Europe',
  'Morocco':'Africa','Mozambique':'Africa','Myanmar':'Asia','Namibia':'Africa','Nepal':'Asia',
  'Netherlands':'Europe','New Zealand':'Oceania','Nicaragua':'North America','Niger':'Africa',
  'Nigeria':'Africa','North Korea':'Asia','North Macedonia':'Europe','Norway':'Europe','Oman':'Asia',
  'Pakistan':'Asia','Palestine':'Asia','Panama':'North America','Papua New Guinea':'Oceania',
  'Paraguay':'South America','Peru':'South America','Philippines':'Asia','Poland':'Europe',
  'Portugal':'Europe','Qatar':'Asia','Romania':'Europe','Russia':'Europe','Rwanda':'Africa',
  'Saudi Arabia':'Asia','Senegal':'Africa','Serbia':'Europe','Sierra Leone':'Africa','Singapore':'Asia',
  'Slovakia':'Europe','Slovenia':'Europe','Somalia':'Africa','South Africa':'Africa','South Korea':'Asia',
  'South Sudan':'Africa','Spain':'Europe','Sri Lanka':'Asia','Sudan':'Africa','Suriname':'South America',
  'Sweden':'Europe','Switzerland':'Europe','Syria':'Asia','Taiwan':'Asia','Tajikistan':'Asia',
  'Tanzania':'Africa','Thailand':'Asia','Timor-Leste':'Asia','Togo':'Africa','Trinidad and Tobago':'North America',
  'Tunisia':'Africa','Turkey':'Asia','Turkmenistan':'Asia','Uganda':'Africa','Ukraine':'Europe',
  'United Arab Emirates':'Asia','United Kingdom':'Europe','United States':'North America',
  'Uruguay':'South America','Uzbekistan':'Asia','Venezuela':'South America','Vietnam':'Asia',
  'Yemen':'Asia','Zambia':'Africa','Zimbabwe':'Africa'
};
const CONTINENTS = ['Africa','Asia','Europe','North America','Oceania','South America'];

const ENERGY_LEVELS = ['high','medium-high','medium','medium-low','low'];
const ENERGY_LABELS  = { 'high':'High', 'medium-high':'Med-High', 'medium':'Medium', 'medium-low':'Med-Low', 'low':'Low' };
const ENERGY_COLORS  = { 'high':'#ff4757', 'medium-high':'#e67e22', 'medium':'#2ecc71', 'medium-low':'#3498db', 'low':'#9b59b6' };

let selectedTrackId = null;
let selectedTrackIds = new Set();
let selectedGenreFilter = new Set();
let selectedYearFilter = new Set();
let selectedCountryFilter = new Set();
let selectedRegionFilter = new Set();
let selectedEnergyFilter = new Set();
let countryDropdownContinent = null;
let yearBucketSize = 5;
const YEAR_BUCKET_SIZES = [1, 5, 10, 25];
let incompleteFields = new Set(); // 'genre' | 'year' | 'country' | 'energy'
let showFlaggedOnly = false;
let currentOffset = 0;
let totalTracks = 0;
let isLoading = false;
let reviewMode = false;
let reviewQueue = [];
let reviewIndex = 0;
const audio = document.getElementById('audio-player');

const COLORS = [
  '#1db954','#e74c3c','#3498db','#f39c12','#9b59b6','#1abc9c',
  '#e67e22','#e91e8c','#00bcd4','#ff5722','#8bc34a','#607d8b',
  '#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#dda0dd',
  '#98d8c8','#f7dc6f','#bb8fce','#85c1e9','#f0b27a','#82e0aa',
  '#f1948a','#7fb3d3','#a9cce3','#d2b4de','#a3e4d7','#fad7a0',
  '#e040fb','#00e5ff','#76ff03','#ff6d00','#d500f9','#00b0ff',
  '#c6ff00','#ff4081','#18ffff','#b9f6ca','#ffd180','#ea80fc',
  '#a7ffeb','#ffff8d','#ff9e80','#80d8ff','#ccff90','#ff80ab',
  '#b388ff','#69f0ae','#ff6e40','#40c4ff','#b2ff59','#ff4569',
  '#e6ee9c','#80cbc4','#ce93d8','#ffab40','#4db6ac','#f48fb1',
  '#c5e1a5','#ffe082','#90caf9','#ef9a9a','#a5d6a7','#fff59d',
];
let colorIdx = 0;

// ── PERSISTENCE ──
function saveData() {
  invalidateGenreCounts();
  localStorage.setItem('objectsort_genres', JSON.stringify(genres));
  localStorage.setItem('objectsort_tags', JSON.stringify(tags));
  localStorage.setItem('objectsort_tracks', JSON.stringify(tracks));
  localStorage.setItem('objectsort_offset', String(currentOffset));
  localStorage.setItem('objectsort_total', String(totalTracks));
  localStorage.setItem('objectsort_genre_mappings', JSON.stringify(genreMappings));
  localStorage.setItem('objectsort_track_meta', JSON.stringify(trackMeta));
  localStorage.setItem('objectsort_flagged', JSON.stringify([...flagged]));
  localStorage.setItem('objectsort_removed', JSON.stringify([...removedIds]));
  localStorage.setItem('objectsort_unavailable', JSON.stringify([...unavailableIds]));
  localStorage.setItem('objectsort_takendown', JSON.stringify([...takenDownIds]));
  if (ACCESS_TOKEN) localStorage.setItem('objectsort_token', ACCESS_TOKEN);
}

function loadData() {
  const g = localStorage.getItem('objectsort_genres');
  const t = localStorage.getItem('objectsort_tags');
  const tr = localStorage.getItem('objectsort_tracks');
  const off = localStorage.getItem('objectsort_offset');
  const tot = localStorage.getItem('objectsort_total');
  const gm = localStorage.getItem('objectsort_genre_mappings');
  if (g) genres = JSON.parse(g);
  if (t) tags = JSON.parse(t);
  if (tr) { try { tracks = JSON.parse(tr); } catch(e) {} }
  if (off) currentOffset = parseInt(off, 10);
  if (tot) totalTracks = parseInt(tot, 10);
  if (gm) { try { genreMappings = JSON.parse(gm); } catch(e) {} }
  const tm = localStorage.getItem('objectsort_track_meta');
  if (tm) { try { trackMeta = JSON.parse(tm); } catch(e) {} }
  const fl = localStorage.getItem('objectsort_flagged');
  if (fl) { try { flagged = new Set(JSON.parse(fl)); } catch(e) {} }
  const rm = localStorage.getItem('objectsort_removed');
  if (rm) { try { removedIds = new Set(JSON.parse(rm)); } catch(e) {} }
  const uv = localStorage.getItem('objectsort_unavailable');
  if (uv) { try { unavailableIds = new Set(JSON.parse(uv)); } catch(e) {} }
  const td = localStorage.getItem('objectsort_takendown');
  if (td) { try { takenDownIds = new Set(JSON.parse(td)); } catch(e) {} }
  // Migrate old single-country string to array
  Object.values(trackMeta).forEach(m => {
    if (m.country !== undefined && !m.countries) {
      m.countries = m.country ? [m.country] : [];
      delete m.country;
    }
    if (!m.countries) m.countries = [];
  });
  colorIdx = genres.length % COLORS.length;
  invalidateGenreCounts();
  // Deduplicate colors across existing genres
  const usedColors = new Set();
  genres.forEach(g => {
    if (usedColors.has(g.color)) {
      const unused = COLORS.find(c => !usedColors.has(c));
      g.color = unused || g.color;
    }
    usedColors.add(g.color);
  });
  // Populate datalist for bulk bar
  const dl = document.getElementById('country-datalist');
  if (dl && !dl.hasChildNodes()) COUNTRIES.forEach(c => { const o = document.createElement('option'); o.value = c; dl.appendChild(o); });
}

// ── AUTH (PKCE) ──
function base64urlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function generatePKCE() {
  const verifier = base64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const hashed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64urlEncode(hashed) };
}

async function startAuth() {
  CLIENT_ID = document.getElementById('client-id-input').value.trim();
  if (!CLIENT_ID) return alert('Please enter your Client ID');
  localStorage.setItem('objectsort_client_id', CLIENT_ID);
  const { verifier, challenge } = await generatePKCE();
  localStorage.setItem('objectsort_pkce_verifier', verifier);
  const redirectUri = location.origin + location.pathname;
  const params = new URLSearchParams({
    client_id: CLIENT_ID, response_type: 'code', redirect_uri: redirectUri,
    scope: 'user-library-read playlist-modify-public playlist-modify-private',
    code_challenge_method: 'S256', code_challenge: challenge,
    show_dialog: 'true'
  });
  location.href = 'https://accounts.spotify.com/authorize?' + params;
}

async function exchangeCode(code) {
  const verifier = localStorage.getItem('objectsort_pkce_verifier');
  const redirectUri = location.origin + location.pathname;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: verifier })
  });
  const data = await res.json();
  console.log('[auth] granted scopes:', data.scope);
  if (data.access_token) {
    ACCESS_TOKEN = data.access_token;
    localStorage.setItem('objectsort_token', ACCESS_TOKEN);
    if (data.refresh_token) localStorage.setItem('objectsort_refresh_token', data.refresh_token);
    localStorage.setItem('objectsort_token_expiry', String(Date.now() + (data.expires_in - 60) * 1000));
    localStorage.removeItem('objectsort_pkce_verifier');
    history.replaceState(null, '', location.pathname);
    return true;
  }
  return false;
}

async function refreshAccessToken() {
  const rt = localStorage.getItem('objectsort_refresh_token');
  if (!rt) return false;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: rt })
  });
  const data = await res.json();
  if (data.access_token) {
    ACCESS_TOKEN = data.access_token;
    localStorage.setItem('objectsort_token', ACCESS_TOKEN);
    if (data.refresh_token) localStorage.setItem('objectsort_refresh_token', data.refresh_token);
    localStorage.setItem('objectsort_token_expiry', String(Date.now() + (data.expires_in - 60) * 1000));
    return true;
  }
  return false;
}

async function ensureValidToken() {
  if (Date.now() > parseInt(localStorage.getItem('objectsort_token_expiry') || '0', 10))
    await refreshAccessToken();
}

function logout() {
  ['objectsort_token','objectsort_refresh_token','objectsort_token_expiry','objectsort_pkce_verifier']
    .forEach(k => localStorage.removeItem(k));
  ACCESS_TOKEN = '';
  location.href = location.origin + location.pathname;
}

async function checkAuth() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const clientId = localStorage.getItem('objectsort_client_id');
  if (!clientId) return false;
  CLIENT_ID = clientId;
  if (code) { history.replaceState(null,'',location.pathname); return await exchangeCode(code); }
  const token = localStorage.getItem('objectsort_token');
  if (token) { ACCESS_TOKEN = token; await ensureValidToken(); return !!ACCESS_TOKEN; }
  if (clientId) document.getElementById('client-id-input').value = clientId;
  return false;
}

// ── API ──
async function api(path, method='GET', body=null) {
  await ensureValidToken();
  const opts = { method, headers: { Authorization: 'Bearer ' + ACCESS_TOKEN, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('https://api.spotify.com/v1' + path, opts);
  if (res.status === 401) {
    if (!await refreshAccessToken()) { logout(); return null; }
    const retry = await fetch('https://api.spotify.com/v1' + path,
      { ...opts, headers: { Authorization: 'Bearer ' + ACCESS_TOKEN, 'Content-Type': 'application/json' } });
    if (!retry.ok) throw new Error(await retry.text());
    if (retry.status === 204) return null;
    return retry.json();
  }
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

// ── LOAD TRACKS ──
function mapTrack(t, addedAt = '') {
  return {
    id: t.id, title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    artistId: t.artists?.[0]?.id || '',
    artistIds: t.artists?.map(a => a.id).filter(Boolean) || [],
    album: t.album.name,
    releaseDate: t.album.release_date || '',
    art: t.album.images?.[1]?.url || t.album.images?.[0]?.url || '',
    preview_url: t.preview_url,
    duration_ms: t.duration_ms,
    addedAt
  };
}

async function loadTracks() {
  isLoading = true;
  setStatus('Connecting to Spotify...');
  updateLibraryBar();
  const me = await api('/me');
  if (!me) return;
  document.getElementById('status-user').textContent = me.display_name;
  const knownIds = new Set(tracks.map(t => t.id));
  // Check for newly added songs at the top of the library
  if (knownIds.size > 0) {
    setStatus('Checking for new songs...');
    const newTracks = [];
    let offset = 0, foundExisting = false;
    while (!foundExisting) {
      const data = await api('/me/tracks?limit=50&offset=' + offset + '&market=from_token');
      if (!data || !data.items || data.items.length === 0) break;
      totalTracks = data.total;
      for (const item of data.items) {
        const t = item.track;
        if (!t) {
          const match = tracks.find(tr => tr.addedAt === item.added_at);
          if (match) takenDownIds.add(match.id);
          continue;
        }
        if (t.is_playable === false) { unavailableIds.add(t.id); }
        if (knownIds.has(t.id)) { foundExisting = true; break; }
        if (!removedIds.has(t.id)) newTracks.push(mapTrack(t, item.added_at));
      }
      if (foundExisting || !data.next) break;
      offset += data.items.length;
    }
    if (newTracks.length > 0) {
      tracks = [...newTracks, ...tracks];
      currentOffset += newTracks.length;
      saveData();
      setStatus(`✓ ${newTracks.length} new song${newTracks.length > 1 ? 's' : ''} added`);
    }
  }
  // Continue fetching if library isn't fully loaded yet
  if (currentOffset < totalTracks || knownIds.size === 0) {
    isLoading = false;
    await loadMoreTracks(false);
    return;
  }
  setStatus(`All ${tracks.length.toLocaleString()} tracks loaded`);
  isLoading = false;
  renderSongList();
  updateStats();
  startStatTicker();
}

async function loadMoreTracks(reset=false) {
  if (isLoading && !reset) return;
  isLoading = true;
  const addedAtMap = {};
  tracks.forEach(t => { if (t.addedAt) addedAtMap[t.addedAt] = t; });
  if (reset) { tracks = []; currentOffset = 0; unavailableIds = new Set(); }
  updateLibraryBar();
  while (true) {
    const data = await api(`/me/tracks?limit=50&offset=${currentOffset}&market=from_token`);
    if (!data || !data.items || data.items.length === 0) break;
    totalTracks = data.total;
    for (const item of data.items) {
      if (!item.track) {
        const cached = addedAtMap[item.added_at];
        if (cached) { takenDownIds.add(cached.id); tracks.push(cached); }
        continue;
      }
      if (item.track.is_playable === false) unavailableIds.add(item.track.id);
      if (!removedIds.has(item.track.id)) tracks.push(mapTrack(item.track, item.added_at));
    }
    currentOffset += data.items.length;
    setProgress(10 + (currentOffset / totalTracks) * 80);
    updateLibraryBar();
    if (currentOffset % 500 === 0) {
      renderSongList(); updateStats(); saveData();
      if (document.getElementById('unstreamable-modal')?.classList.contains('open')) renderUnstreamableList();
    }
    if (!data.next) break;
  }
  isLoading = false;
  setProgress(100);
  setTimeout(() => setProgress(0), 500);
  setStatus(`All ${tracks.length.toLocaleString()} tracks loaded`);
  saveData(); renderSongList(); updateStats(); startStatTicker();
  if (document.getElementById('unstreamable-modal')?.classList.contains('open')) renderUnstreamableList();
}

// ── GENRES ──
function nextColor() {
  const used = new Set(genres.map(g => g.color));
  const unused = COLORS.find(c => !used.has(c));
  if (unused) return unused;
  // All colors taken — pick least used
  const counts = Object.fromEntries(COLORS.map(c => [c, 0]));
  genres.forEach(g => { if (counts[g.color] !== undefined) counts[g.color]++; });
  return COLORS.reduce((a, b) => counts[a] <= counts[b] ? a : b);
}

function addGenre() {
  const name = document.getElementById('new-genre-name').value.trim();
  if (!name) return;
  const parentId = document.getElementById('new-genre-parent').value || null;
  genres.push({ id: Date.now().toString(), name, color: nextColor(), parentId });
  document.getElementById('new-genre-name').value = '';
  saveData(); renderGenreTree(); renderParentSelect(); }

function deleteGenre(id) {
  const toDelete = new Set();
  const collect = gid => { toDelete.add(gid); genres.filter(g=>g.parentId===gid).forEach(g=>collect(g.id)); };
  collect(id);
  genres = genres.filter(g => !toDelete.has(g.id));
  for (const tid in tags) tags[tid] = tags[tid].filter(gid => !toDelete.has(gid));
  saveData(); renderGenreTree(); renderParentSelect(); renderSongList(); updateStats();
}

function getGenre(id) { return genres.find(g => g.id === id); }

function getGenrePath(id) {
  const parts = [];
  let g = getGenre(id);
  while (g) { parts.unshift(g.name); g = g.parentId ? getGenre(g.parentId) : null; }
  return parts.join(' › ');
}

function renderGenreTree() {
  const list = document.getElementById('genre-list');
  list.innerHTML = '';
  const q = (document.getElementById('genre-search')?.value || '').toLowerCase().trim();
  const hideEmpty = _hasNonGenreFilter();
  const matchesSearch = g => !q || g.name.toLowerCase().includes(q) ||
    genres.filter(c => c.parentId === g.id).some(c => c.name.toLowerCase().includes(q));
  const visibleRoot = genres.filter(g => !g.parentId && matchesSearch(g) && (!hideEmpty || _hasMatchingDescendant(g.id)));
  visibleRoot
    .sort((a, b) => getTrackCountForGenre(b.id) - getTrackCountForGenre(a.id))
    .forEach(g => list.appendChild(buildGenreNode(g, q, hideEmpty)));
  updateStats();
}

function _hasMatchingDescendant(gid) {
  if (getTrackCountForGenre(gid) > 0) return true;
  return genres.filter(g => g.parentId === gid).some(c => _hasMatchingDescendant(c.id));
}

function buildGenreNode(genre, searchQ = '', hideEmpty = false) {
  const children = genres.filter(g => g.parentId === genre.id)
    .filter(c => !hideEmpty || _hasMatchingDescendant(c.id))
    .sort((a, b) => getTrackCountForGenre(b.id) - getTrackCountForGenre(a.id));
  const wrap = document.createElement('div'); wrap.className = 'g-item';
  const row = document.createElement('div');
  row.className = 'g-row' + (selectedGenreFilter.has(genre.id) ? ' selected' : '');
  row.dataset.genreId = genre.id;
  let clickTimer = null;
  row.onclick = e => {
    if (e.target.classList.contains('g-del') || e.target.tagName === 'INPUT') return;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => filterByGenreExclusive(genre.id), 220);
  };
  row.ondblclick = e => { clearTimeout(clickTimer); };
  row.oncontextmenu = e => { e.preventDefault(); filterByGenre(genre.id); };
  const caret = document.createElement('span'); caret.className = 'g-caret';
  caret.textContent = children.length ? '▶' : '';
  const childWrap = document.createElement('div'); childWrap.className = 'g-children';
  const autoExpand = searchQ && children.some(c => c.name.toLowerCase().includes(searchQ));
  if (children.length) {
    caret.style.cursor = 'pointer';
    caret.onclick = e => { e.stopPropagation(); caret.classList.toggle('open'); childWrap.classList.toggle('open'); };
    if (autoExpand) { caret.classList.add('open'); childWrap.classList.add('open'); }
  }
  const dot = document.createElement('span'); dot.className = 'g-dot'; dot.style.background = genre.color;
  dot.title = 'Click to change color';
  dot.style.cursor = 'pointer';
  dot.onclick = e => {
    e.stopPropagation();
    const idx = COLORS.indexOf(genre.color);
    genre.color = COLORS[(idx + 1) % COLORS.length];
    dot.style.background = genre.color;
    saveData();
    document.querySelectorAll(`#genre-list .g-row[data-genre-id="${genre.id}"] .g-dot`).forEach(d => d.style.background = genre.color);
  };
  const name = document.createElement('span'); name.className = 'g-name'; name.textContent = genre.name;
  name.title = 'Double-click to rename';
  name.ondblclick = e => {
    e.stopPropagation();
    clearTimeout(clickTimer);
    const input = document.createElement('input');
    input.value = genre.name;
    input.style.cssText = 'flex:1;background:#1a1a1a;border:1px solid #f59e0b;border-radius:4px;padding:1px 5px;color:#eee;font-size:0.78rem;font-family:inherit;outline:none;min-width:0';
    name.replaceWith(input);
    input.focus(); input.select();
    const commit = () => {
      const val = input.value.trim();
      if (val && val !== genre.name) { genre.name = val; saveData(); renderGenreTree(); renderParentSelect(); }
      else { input.replaceWith(name); }
    };
    input.onblur = commit;
    input.onkeydown = e2 => { if (e2.key === 'Enter') { input.blur(); } else if (e2.key === 'Escape') { input.value = genre.name; input.blur(); } e2.stopPropagation(); };
  };
  const cnt = document.createElement('span'); cnt.className = 'g-count'; cnt.textContent = getTrackCountForGenre(genre.id);
  const del = document.createElement('button'); del.className = 'g-del'; del.textContent = '✕';
  del.onclick = e => {
    e.stopPropagation();
    if (del.dataset.confirming === 'true') {
      deleteGenre(genre.id);
    } else {
      del.textContent = '?';
      del.style.color = '#e87';
      del.dataset.confirming = 'true';
      setTimeout(() => {
        if (del.dataset.confirming === 'true') {
          del.textContent = '✕';
          del.style.color = '';
          del.dataset.confirming = 'false';
        }
      }, 2500);
    }
  };
  row.append(caret, dot, name, cnt, del);
  wrap.appendChild(row);
  children.forEach(c => childWrap.appendChild(buildGenreNode(c, searchQ, hideEmpty)));
  wrap.appendChild(childWrap);
  return wrap;
}

function _hasNonGenreFilter() {
  return selectedYearFilter.size > 0 || selectedCountryFilter.size > 0
    || selectedRegionFilter.size > 0 || selectedEnergyFilter.size > 0
    || showFlaggedOnly
    || [...incompleteFields].some(f => f !== 'genre')
    || !!(document.getElementById('search-input')?.value || '').trim();
}

function _tracksMatchingNonGenreFilters() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  const incompleteArr = [...incompleteFields].filter(f => f !== 'genre');
  return tracks.filter(t => {
    if (showFlaggedOnly && !flagged.has(t.id)) return false;
    if (incompleteArr.length > 0) {
      const isMissing = incompleteArr.some(f => {
        if (f === 'year') return !trackMeta[t.id]?.year;
        if (f === 'country') return !(trackMeta[t.id]?.countries?.length);
        if (f === 'energy') return !trackMeta[t.id]?.energy;
      });
      if (!isMissing) return false;
    }
    if (selectedYearFilter.size > 0) {
      const raw = trackMeta[t.id]?.year || (t.releaseDate ? t.releaseDate.slice(0,4) : null);
      const y = raw ? parseInt(raw) : null;
      if (!y) return false;
      const inRange = [...selectedYearFilter].some(key => {
        const [s, e] = key.split('-').map(Number);
        return y >= s && y <= e;
      });
      if (!inRange) return false;
    }
    if (selectedCountryFilter.size > 0) {
      const cs = trackMeta[t.id]?.countries || [];
      if (![...selectedCountryFilter].some(c => cs.includes(c))) return false;
    }
    if (selectedRegionFilter.size > 0) {
      const cs = trackMeta[t.id]?.countries || [];
      if (!cs.some(c => selectedRegionFilter.has(CONTINENT_MAP[c]))) return false;
    }
    if (selectedEnergyFilter.size > 0 && !selectedEnergyFilter.has(trackMeta[t.id]?.energy)) return false;
    if (q && !t.title.toLowerCase().includes(q) && !t.artist.toLowerCase().includes(q)) return false;
    return true;
  });
}

let _genreCountsCache = null;
function _buildGenreCounts() {
  const c = {};
  genres.forEach(g => c[g.id] = 0);
  const source = _hasNonGenreFilter() ? _tracksMatchingNonGenreFilters() : tracks;
  source.forEach(t => (tags[t.id] || []).forEach(gid => { if (c[gid] !== undefined) c[gid]++; }));
  return c;
}
function getGenreCounts() {
  if (!_genreCountsCache) _genreCountsCache = _buildGenreCounts();
  return _genreCountsCache;
}
function invalidateGenreCounts() { _genreCountsCache = null; }
function getTrackCountForGenre(gid) { return getGenreCounts()[gid] || 0; }

let _visibleTracksCache = null;
function invalidateVisibleTracks() { _visibleTracksCache = null; }

function renderParentSelect() {
  const sel = document.getElementById('new-genre-parent');
  sel.innerHTML = '<option value="">Top level</option>';
  genres.forEach(g => { const o = document.createElement('option'); o.value = g.id; o.textContent = getGenrePath(g.id); sel.appendChild(o); });
}

// ── SONG LIST ──
function isFullyTagged(trackId) {
  return (tags[trackId]||[]).length > 0 &&
    (trackMeta[trackId]?.countries?.length || 0) > 0 &&
    !!trackMeta[trackId]?.year;
}

function getVisibleTracks() {
  if (_visibleTracksCache) return _visibleTracksCache;
  const q = document.getElementById('search-input').value.toLowerCase();
  const genreFilterArr = [...selectedGenreFilter];
  const incompleteArr = [...incompleteFields];
  _visibleTracksCache = tracks.filter(t => {
    if (showFlaggedOnly && !flagged.has(t.id)) return false;
    if (incompleteArr.length > 0) {
      const isMissingSelected = incompleteArr.some(f => {
        if (f === 'genre') return !(tags[t.id]||[]).length;
        if (f === 'year') return !trackMeta[t.id]?.year;
        if (f === 'country') return !(trackMeta[t.id]?.countries?.length);
        if (f === 'energy') return !trackMeta[t.id]?.energy;
      });
      if (!isMissingSelected) return false;
    }
    if (genreFilterArr.length > 0 && !genreFilterArr.every(gid => (tags[t.id]||[]).includes(gid))) return false;
    if (selectedYearFilter.size > 0) {
      const rawYear = trackMeta[t.id]?.year || (t.releaseDate ? t.releaseDate.slice(0,4) : null);
      const year = rawYear ? parseInt(rawYear) : null;
      if (!year) return false;
      const inRange = [...selectedYearFilter].some(key => {
        const [s, e] = key.split('-').map(Number);
        return year >= s && year <= e;
      });
      if (!inRange) return false;
    }
    if (selectedCountryFilter.size > 0) {
      const tc = trackMeta[t.id]?.countries || [];
      if (![...selectedCountryFilter].some(c => tc.includes(c))) return false;
    }
    if (selectedRegionFilter.size > 0) {
      const tCountries = trackMeta[t.id]?.countries || [];
      if (!tCountries.some(c => selectedRegionFilter.has(CONTINENT_MAP[c]))) return false;
    }
    if (selectedEnergyFilter.size > 0 && !selectedEnergyFilter.has(trackMeta[t.id]?.energy)) return false;
    if (q && !t.title.toLowerCase().includes(q) && !t.artist.toLowerCase().includes(q)) return false;
    return true;
  });
  return _visibleTracksCache;
}

const ROW_H = 76;
const OVERSCAN = 10;
let _visibleCache = [];
let _vsInitialized = false;

function buildSongRow(t, idx) {
  const isBulk = selectedTrackIds.has(t.id);
  const isUnavailable = unavailableIds.has(t.id) || takenDownIds.has(t.id);
  const row = document.createElement('div');
  row.className = 'song-row' + (selectedTrackId === t.id ? ' active' : '') + (isBulk ? ' bulk-selected' : '') + (isUnavailable ? ' unavailable' : '');
  row.style.top = (idx * ROW_H) + 'px';
  row.dataset.trackId = t.id;
  row.onclick = (e) => { if (e.ctrlKey || e.metaKey) { toggleBulkSelect(t.id); return; } selectTrack(t.id); };
  row.oncontextmenu = (e) => { e.preventDefault(); toggleBulkSelect(t.id); };
  const img = document.createElement('img'); img.className = 'song-art'; img.src = t.art; img.loading = 'lazy';
  const info = document.createElement('div'); info.className = 'song-info';
  const title = document.createElement('div'); title.className = 'song-title'; title.textContent = t.title;
  const artist = document.createElement('div'); artist.className = 'song-artist'; artist.textContent = t.artist;
  const tagsDiv = document.createElement('div'); tagsDiv.className = 'song-tags';
  [...(tags[t.id]||[])].sort((a,b) => getTrackCountForGenre(b) - getTrackCountForGenre(a)).forEach(gid => {
    const g = getGenre(gid); if (!g) return;
    const chip = document.createElement('span'); chip.className = 'tag-chip';
    chip.textContent = g.name; chip.style.color = g.color; chip.style.borderColor = g.color + '55';
    tagsDiv.appendChild(chip);
  });
  const meta = trackMeta[t.id];
  const countries = meta?.countries || [];
  const hasMetaLine = meta?.year || countries.length || meta?.energy;
  if (hasMetaLine) {
    const metaLine = document.createElement('div');
    metaLine.style.cssText = 'font-size:0.63rem;color:#444;margin-top:2px;display:flex;align-items:center;gap:4px;overflow:hidden';
    const metaParts = [];
    if (meta?.year) metaParts.push(meta.year);
    if (metaParts.length) {
      const txt = document.createElement('span');
      txt.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      txt.textContent = metaParts.join(' · ');
      metaLine.appendChild(txt);
    }
    if (countries.length) {
      const countrySpan = document.createElement('span');
      countrySpan.style.cssText = 'white-space:nowrap;flex-shrink:0';
      countrySpan.textContent = (metaParts.length ? '· ' : '') + countries[0];
      metaLine.appendChild(countrySpan);
      if (countries.length > 1) {
        const more = document.createElement('span');
        more.textContent = `+${countries.length - 1}`;
        more.title = countries.slice(1).join(', ');
        more.style.cssText = 'font-size:0.58rem;color:#555;cursor:default;flex-shrink:0;border:1px solid #333;border-radius:4px;padding:0 3px';
        metaLine.appendChild(more);
      }
    }
    if (meta?.energy) {
      const dot = document.createElement('span');
      dot.style.cssText = `width:5px;height:5px;border-radius:50%;background:${ENERGY_COLORS[meta.energy]};flex-shrink:0`;
      dot.title = ENERGY_LABELS[meta.energy];
      metaLine.appendChild(dot);
    }
    info.append(title, artist, metaLine, tagsDiv);
  } else {
    info.append(title, artist, tagsDiv);
  }
  const play = document.createElement('div'); play.className = 'song-play';
  if (flagged.has(t.id)) { play.textContent = '⍟'; play.style.color = '#ff2d78'; play.style.fontSize = '0.45rem'; }
  else if (isFullyTagged(t.id)) { play.textContent = '·'; play.style.color = 'rgba(245,158,11,0.6)'; }
  row.append(img, info, play);
  return row;
}

function _vsRenderWindow() {
  const list = document.getElementById('song-list');
  if (!list || !_visibleCache.length) return;
  const scrollTop = list.scrollTop;
  const viewH = list.clientHeight;
  const first = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const last = Math.min(_visibleCache.length - 1, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN);
  // Remove rows outside window
  list.querySelectorAll('.song-row').forEach(r => {
    const idx = parseInt(r.dataset.idx);
    if (idx < first || idx > last) r.remove();
  });
  // Add rows inside window not yet rendered
  const rendered = new Set([...list.querySelectorAll('.song-row')].map(r => parseInt(r.dataset.idx)));
  for (let i = first; i <= last; i++) {
    if (rendered.has(i)) continue;
    const row = buildSongRow(_visibleCache[i], i);
    row.dataset.idx = i;
    list.appendChild(row);
  }
}

function renderOpenFilters() {
  if (document.getElementById('year-filter-list')?.style.display !== 'none') renderYearFilter();
  if (document.getElementById('country-filter-list')?.style.display !== 'none') renderCountryFilter();
  if (document.getElementById('region-filter-list')?.style.display !== 'none') renderRegionFilter();
  if (document.getElementById('energy-filter-list')?.style.display !== 'none') renderEnergyFilter();
}

function renderSongList() {
  invalidateVisibleTracks();
  invalidateGenreCounts();
  renderGenreTree();
  renderOpenFilters();
  const list = document.getElementById('song-list');
  if (isLoading && tracks.length === 0) {
    list.innerHTML = '<div class="loading-msg"><div class="spinner"></div>Loading your library...</div>';
    _vsInitialized = false; return;
  }
  _visibleCache = getVisibleTracks();
  if (_visibleCache.length === 0) {
    list.innerHTML = '<div class="loading-msg">No songs found</div>';
    _vsInitialized = false; return;
  }
  // Set up spacer for full scroll height, clear old rows
  list.querySelectorAll('.song-row, .vs-spacer, .loading-msg').forEach(el => el.remove());
  const spacer = document.createElement('div');
  spacer.className = 'vs-spacer';
  spacer.style.cssText = `height:${_visibleCache.length * ROW_H}px;pointer-events:none`;
  list.appendChild(spacer);
  if (!_vsInitialized) {
    list.onscroll = _vsRenderWindow;
    _vsInitialized = true;
  }
  _vsRenderWindow();
  updateStats();
}

function filterSongs() { renderSongList(); }

function toggleFlag(trackId) {
  if (flagged.has(trackId)) flagged.delete(trackId);
  else flagged.add(trackId);
  saveData();
  // Update dot on the rendered row without full re-render
  const row = document.querySelector(`#song-list .song-row[data-track-id="${trackId}"]`);
  if (row) {
    const dot = row.querySelector('.song-play');
    if (dot) {
      if (flagged.has(trackId)) { dot.textContent = '⍟'; dot.style.color = '#ff2d78'; dot.style.fontSize = '0.45rem'; }
      else if (isFullyTagged(trackId)) { dot.textContent = '·'; dot.style.color = 'rgba(245,158,11,0.6)'; }
      else { dot.textContent = ''; }
    }
  }
  updateFlagBtn(trackId);
  if (showFlaggedOnly) renderSongList();
}

function toggleFlagSelected() {
  if (selectedTrackId) toggleFlag(selectedTrackId);
}

function removeTrackFromLibrary() {
  if (!selectedTrackId) return;
  const btn = document.getElementById('remove-track-btn');
  if (!btn) return;

  if (btn.dataset.confirming !== 'true') {
    // First click — ask for confirmation
    btn.textContent = 'Confirm?';
    btn.style.color = '#e87';
    btn.style.borderColor = '#e87';
    btn.dataset.confirming = 'true';
    setTimeout(() => {
      if (btn.dataset.confirming === 'true') {
        btn.textContent = '✕ Remove';
        btn.style.color = '#555';
        btn.style.borderColor = '#2a2a2a';
        btn.dataset.confirming = 'false';
      }
    }, 3000);
    return;
  }

  // Second click — remove from local database and blocklist from future syncs
  const id = selectedTrackId;
  tracks = tracks.filter(t => t.id !== id);
  delete tags[id];
  flagged.delete(id);
  removedIds.add(id);
  selectedTrackId = null;

  saveData();
  renderSongList();
  updateStats();
  renderGenreTree();

  document.getElementById('song-detail').style.display = 'none';
  document.getElementById('no-song-msg').style.display = 'block';

  btn.textContent = '✕ Remove';
  btn.style.color = '#555';
  btn.style.borderColor = '#2a2a2a';
  btn.dataset.confirming = 'false';
}

function updateFlagBtn(trackId) {
  const btn = document.getElementById('flag-btn');
  if (!btn) return;
  const isFlagged = flagged.has(trackId);
  btn.textContent = isFlagged ? '⍟ Flagged' : '⍟ Flag';
  btn.style.color = isFlagged ? '#ff2d78' : '#555';
  btn.style.borderColor = isFlagged ? '#ff2d78' : '#2a2a2a';
}

function toggleFlaggedFilter() {
  showFlaggedOnly = !showFlaggedOnly;
  document.getElementById('flagged-toggle').style.color = showFlaggedOnly ? '#ff2d78' : '';
  document.getElementById('flagged-toggle').style.borderColor = showFlaggedOnly ? '#ff2d78' : '';
  renderSongList();
}

function jumpToSelected() {
  if (!selectedTrackId) return;
  const idx = _visibleCache.findIndex(t => t.id === selectedTrackId);
  if (idx === -1) return;
  const list = document.getElementById('song-list');
  const rowTop = idx * ROW_H;
  list.scrollTop = rowTop - list.clientHeight / 2 + ROW_H / 2;
  _vsRenderWindow();
}

// ── BULK SELECTION ──
function toggleBulkSelect(trackId) {
  if (selectedTrackIds.has(trackId)) selectedTrackIds.delete(trackId);
  else selectedTrackIds.add(trackId);
  renderBulkBar();
  const row = document.querySelector(`#song-list .song-row[data-track-id="${trackId}"]`);
  if (row) row.classList.toggle('bulk-selected', selectedTrackIds.has(trackId));
  if (selectedTrackIds.size > 0) showTagBubble(true);
  else hideTagBubble();
}

function clearBulkSelection() {
  selectedTrackIds.clear();
  renderBulkBar();
  document.querySelectorAll('#song-list .song-row').forEach(r => r.classList.remove('bulk-selected'));
}

function renderBulkBar() {
  const bar = document.getElementById('bulk-bar');
  const n = selectedTrackIds.size;
  bar.style.display = n > 0 ? 'flex' : 'none';
  document.getElementById('bulk-label').textContent = `${n} selected`;
  document.getElementById('bulk-year').value = '';
  document.getElementById('bulk-country').value = '';
}

function showBulkDropdown() {
  const input = document.getElementById('bulk-input');
  const dropdown = document.getElementById('bulk-dropdown');
  const q = input.value.toLowerCase().trim();
  const matches = genres.filter(g => !q || g.name.toLowerCase().includes(q)).slice(0, 10);
  dropdown.innerHTML = '';
  matches.forEach(g => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.6rem;cursor:pointer;font-size:0.8rem';
    item.onmouseover = () => item.style.background = '#1a1a1a';
    item.onmouseout = () => item.style.background = '';
    const dot = document.createElement('span');
    dot.style.cssText = `width:6px;height:6px;border-radius:50%;background:${g.color};flex-shrink:0`;
    const name = document.createElement('span'); name.textContent = g.name;
    item.append(dot, name);
    item.onmousedown = () => { applyBulkTag(g.id); };
    dropdown.appendChild(item);
  });
  if (q && !matches.find(g => g.name.toLowerCase() === q)) {
    const create = document.createElement('div');
    create.style.cssText = 'padding:0.35rem 0.6rem;font-size:0.78rem;color:#f59e0b;cursor:pointer' + (matches.length ? ';border-top:1px solid #222' : '');
    create.textContent = `+ Create "${input.value.trim()}" and apply to all`;
    create.onmousedown = () => {
      const g = { id: Date.now().toString(), name: input.value.trim(), color: nextColor(), parentId: null };
      genres.push(g); renderGenreTree(); renderParentSelect();
      applyBulkTag(g.id);
    };
    dropdown.appendChild(create);
  }
  dropdown.style.display = (matches.length || q) ? 'block' : 'none';
}

function hideBulkDropdown() {
  const dd = document.getElementById('bulk-dropdown');
  if (dd) dd.style.display = 'none';
}

function handleBulkInput(e) {
  if (e.key === 'Escape') { hideBulkDropdown(); return; }
  if (e.key !== 'Enter') return;
  const q = document.getElementById('bulk-input').value.trim();
  if (!q) return;
  const match = genres.find(g => g.name.toLowerCase() === q.toLowerCase());
  if (match) { applyBulkTag(match.id); return; }
  const g = { id: Date.now().toString(), name: q, color: nextColor(), parentId: null };
  genres.push(g); renderGenreTree(); renderParentSelect();
  applyBulkTag(g.id);
}

function applyBulkTag(genreId) {
  selectedTrackIds.forEach(tid => {
    if (!tags[tid]) tags[tid] = [];
    if (!tags[tid].includes(genreId)) tags[tid].push(genreId);
  });
  saveData();
  renderSongList();
  renderCurrentTags();
  updateStats();
  const input = document.getElementById('tag-input');
  const g = getGenre(genreId);
  if (g && input) {
    input.value = '';
    hideTagDropdown();
    const prev = input.placeholder;
    input.placeholder = `✓ "${g.name}" added to ${selectedTrackIds.size} track${selectedTrackIds.size !== 1 ? 's' : ''}`;
    setTimeout(() => { input.placeholder = prev; }, 2000);
  }
}

function applyBulkYear(year) {
  const v = year.trim();
  if (!v) return;
  selectedTrackIds.forEach(tid => {
    if (!trackMeta[tid]) trackMeta[tid] = {};
    trackMeta[tid].year = v;
  });
  saveData();
  document.getElementById('bulk-year').value = '';
  renderSongList();
  if (selectedTrackId && selectedTrackIds.has(selectedTrackId)) {
    const t = tracks.find(x => x.id === selectedTrackId);
    if (t) renderMeta(t);
  }
}

function applyBulkCountry(country) {
  const v = country.trim();
  if (!v || !COUNTRIES.includes(v)) return;
  selectedTrackIds.forEach(tid => {
    if (!trackMeta[tid]) trackMeta[tid] = {};
    if (!trackMeta[tid].countries) trackMeta[tid].countries = [];
    if (!trackMeta[tid].countries.includes(v)) trackMeta[tid].countries.push(v);
  });
  saveData();
  document.getElementById('bulk-country').value = '';
  renderSongList();
  if (selectedTrackId && selectedTrackIds.has(selectedTrackId)) {
    const t = tracks.find(x => x.id === selectedTrackId);
    if (t) renderMeta(t);
  }
}

// ── SIDEBAR FILTERS ──
function toggleGenreSection() {
  const body = document.getElementById('genre-section-body');
  const caret = document.getElementById('genre-section-caret');
  const collapsed = body.classList.toggle('collapsed');
  caret.style.transform = collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
}

function toggleFilterSection(type) {
  const list = document.getElementById(type + '-filter-list');
  const caret = document.getElementById(type + '-filter-caret');
  const open = list.style.display === 'none';
  list.style.display = open ? 'flex' : 'none';
  caret.textContent = open ? '▾' : '▸';
  if (open) { if (type === 'year') renderYearFilter(); else if (type === 'country') renderCountryFilter(); else if (type === 'region') renderRegionFilter(); else if (type === 'energy') renderEnergyFilter(); }
}

function cycleYearBucket() {
  const idx = YEAR_BUCKET_SIZES.indexOf(yearBucketSize);
  yearBucketSize = YEAR_BUCKET_SIZES[(idx + 1) % YEAR_BUCKET_SIZES.length];
  selectedYearFilter = new Set();
  document.getElementById('year-bucket-btn').textContent = yearBucketSize === 1 ? '1yr' : `${yearBucketSize}yr`;
  renderSongList(); renderYearFilter();
}

function renderYearFilter() {
  const list = document.getElementById('year-filter-list');
  const years = getVisibleTracks().map(t => {
    const y = trackMeta[t.id]?.year;
    return y ? parseInt(y) : null;
  }).filter(Boolean);
  if (!years.length) {
    list.innerHTML = '<span style="font-size:0.7rem;color:#444;padding:0.2rem">No years tagged yet</span>';
    return;
  }
  const buckets = new Map();
  years.forEach(y => {
    const start = Math.floor(y / yearBucketSize) * yearBucketSize;
    const end = start + yearBucketSize - 1;
    const key = `${start}-${end}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  const sorted = [...buckets.keys()].sort().reverse();
  list.innerHTML = '';
  sorted.forEach(key => {
    const chip = document.createElement('span');
    const [s, e] = key.split('-');
    const label = yearBucketSize === 1 ? s : `${s}–${e.slice(-2)}`;
    chip.className = 'filter-chip' + (selectedYearFilter.has(key) ? ' active' : '');
    const countEl = document.createElement('span'); countEl.className = 'chip-count'; countEl.textContent = buckets.get(key);
    chip.append(document.createTextNode(label), countEl);
    chip.onclick = () => {
      if (selectedYearFilter.has(key)) selectedYearFilter.delete(key); else selectedYearFilter.add(key);
      updateResetBtn(); renderSongList(); renderYearFilter();
    };
    list.appendChild(chip);
  });
}

function renderCountryFilter() {
  const list = document.getElementById('country-filter-list');
  const countMap = {};
  getVisibleTracks().forEach(t => (trackMeta[t.id]?.countries || []).forEach(c => { countMap[c] = (countMap[c] || 0) + 1; }));
  const countries = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);
  list.innerHTML = '';
  countries.forEach(c => {
    const count = countMap[c];
    const chip = document.createElement('span');
    chip.className = 'filter-chip' + (selectedCountryFilter.has(c) ? ' active' : '');
    const countEl = document.createElement('span'); countEl.className = 'chip-count'; countEl.textContent = count;
    chip.append(document.createTextNode(c), countEl);
    chip.onclick = () => {
      if (selectedCountryFilter.has(c)) selectedCountryFilter.delete(c); else selectedCountryFilter.add(c);
      updateResetBtn(); renderSongList(); renderCountryFilter();
    };
    list.appendChild(chip);
  });
  if (!countries.length) list.innerHTML = '<span style="font-size:0.7rem;color:#444;padding:0.2rem">No countries tagged yet</span>';
}

function renderRegionFilter() {
  const list = document.getElementById('region-filter-list');
  const continentCounts = new Map();
  getVisibleTracks().forEach(t => {
    (trackMeta[t.id]?.countries || []).forEach(c => {
      const continent = CONTINENT_MAP[c];
      if (continent) continentCounts.set(continent, (continentCounts.get(continent) || 0) + 1);
    });
  });
  list.innerHTML = '';
  if (!continentCounts.size) {
    list.innerHTML = '<span style="font-size:0.7rem;color:#444;padding:0.2rem">No countries tagged yet</span>';
    return;
  }
  [...continentCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).forEach(continent => {
    const chip = document.createElement('span');
    chip.className = 'filter-chip' + (selectedRegionFilter.has(continent) ? ' active' : '');
    const countEl = document.createElement('span'); countEl.className = 'chip-count'; countEl.textContent = continentCounts.get(continent);
    chip.append(document.createTextNode(continent), countEl);
    chip.onclick = () => {
      if (selectedRegionFilter.has(continent)) selectedRegionFilter.delete(continent); else selectedRegionFilter.add(continent);
      updateResetBtn(); renderSongList(); renderRegionFilter();
    };
    list.appendChild(chip);
  });
}

function renderEnergySelector(trackId) {
  const container = document.getElementById('energy-selector');
  container.innerHTML = '';
  container.style.cssText = 'position:relative;height:38px;width:100%;margin-bottom:0.25rem';
  const current = trackMeta[trackId]?.energy || null;
  const levels = ['low','medium-low','medium','medium-high','high'];
  const shortLabels = ['Low','Med-L','Med','Med-H','High'];

  // Base track
  const track = document.createElement('div');
  track.style.cssText = 'position:absolute;top:8px;left:0;right:0;height:1px;background:#2a2a2a';
  container.appendChild(track);

  // Colored gradient fill from left up to selected dot
  if (current) {
    const idx = levels.indexOf(current);
    const fill = document.createElement('div');
    fill.style.cssText = `position:absolute;top:7px;left:0;width:${idx/(levels.length-1)*100}%;height:3px;border-radius:2px;
      background:linear-gradient(to right,transparent,${ENERGY_COLORS[current]})`;
    container.appendChild(fill);
  }

  levels.forEach((level, i) => {
    const pct = i / (levels.length - 1) * 100;
    const isSelected = current === level;
    const color = ENERGY_COLORS[level];

    const dot = document.createElement('div');
    dot.style.cssText = `position:absolute;top:3px;left:${pct}%;transform:translateX(-50%);
      width:11px;height:11px;border-radius:50%;z-index:1;cursor:pointer;transition:all 0.15s;
      background:${isSelected ? color : '#1a1a1a'};border:1px solid ${isSelected ? color : '#333'}`;
    dot.onclick = () => setEnergy(trackId, isSelected ? null : level);
    dot.onmouseover = () => { if (!isSelected) { dot.style.background='#2a2a2a'; dot.style.borderColor='#444'; } };
    dot.onmouseout = () => { if (!isSelected) { dot.style.background='#1a1a1a'; dot.style.borderColor='#333'; } };
    container.appendChild(dot);

    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;top:19px;left:${pct}%;transform:translateX(-50%);
      font-size:0.58rem;color:${isSelected ? color : '#444'};white-space:nowrap;cursor:pointer`;
    lbl.textContent = shortLabels[i];
    lbl.onclick = () => setEnergy(trackId, isSelected ? null : level);
    container.appendChild(lbl);
  });
}

function setEnergy(trackId, level) {
  if (!trackMeta[trackId]) trackMeta[trackId] = {};
  if (level) trackMeta[trackId].energy = level;
  else delete trackMeta[trackId].energy;
  saveData();
  renderEnergySelector(trackId);
  renderSongList();
  if (document.getElementById('energy-filter-list').style.display !== 'none') renderEnergyFilter();
}

function renderEnergyFilter() {
  const list = document.getElementById('energy-filter-list');
  list.innerHTML = '';
  let hasAny = false;
  // Count from tracks matching all filters except energy, so other levels remain clickable
  const savedEnergy = selectedEnergyFilter;
  selectedEnergyFilter = new Set();
  invalidateVisibleTracks();
  const baseIds = new Set(getVisibleTracks().map(t => t.id));
  selectedEnergyFilter = savedEnergy;
  invalidateVisibleTracks();
  ENERGY_LEVELS.forEach(level => {
    const count = Object.entries(trackMeta).filter(([id, m]) => baseIds.has(id) && m.energy === level).length;
    if (!count) return;
    hasAny = true;
    const chip = document.createElement('span');
    chip.className = 'filter-chip' + (selectedEnergyFilter.has(level) ? ' active' : '');
    const left = document.createElement('span');
    left.style.cssText = 'display:flex;align-items:center;gap:4px';
    const dot = document.createElement('span');
    dot.style.cssText = `width:6px;height:6px;border-radius:50%;background:${ENERGY_COLORS[level]};flex-shrink:0;display:inline-block`;
    left.append(dot, document.createTextNode(ENERGY_LABELS[level]));
    const countEl = document.createElement('span'); countEl.className = 'chip-count'; countEl.textContent = count;
    chip.append(left, countEl);
    chip.onclick = () => {
      if (selectedEnergyFilter.has(level)) selectedEnergyFilter.delete(level); else selectedEnergyFilter.add(level);
      updateResetBtn(); renderSongList(); renderEnergyFilter();
    };
    list.appendChild(chip);
  });
  if (!hasAny) list.innerHTML = '<span style="font-size:0.7rem;color:#444;padding:0.2rem">No energy tagged yet</span>';
}

// ── TAG INPUT ──
function showTagDropdown() {
  if (!selectedTrackId && selectedTrackIds.size === 0) return;
  const input = document.getElementById('tag-input');
  const dropdown = document.getElementById('tag-dropdown');
  const q = input.value.toLowerCase().trim();
  if (!q) { hideTagDropdown(); return; }
  const songTags = selectedTrackId ? (tags[selectedTrackId] || []) : [];
  const matches = genres.filter(g => g.name.toLowerCase().includes(q)).slice(0, 10);
  dropdown.innerHTML = '';
  matches.forEach(g => {
    const tagged = songTags.includes(g.id);
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.6rem;cursor:pointer;font-size:0.8rem' + (tagged ? ';background:rgba(245,158,11,0.08)' : '');
    item.onmouseover = () => item.style.background = tagged ? 'rgba(245,158,11,0.12)' : '#1a1a1a';
    item.onmouseout = () => item.style.background = tagged ? 'rgba(245,158,11,0.08)' : '';
    const dot = document.createElement('span');
    dot.style.cssText = `width:6px;height:6px;border-radius:50%;background:${g.color};flex-shrink:0`;
    const name = document.createElement('span'); name.textContent = g.name; name.style.flex = '1';
    const check = document.createElement('span'); check.textContent = tagged ? '✓' : ''; check.style.color = '#f59e0b';
    item.append(dot, name, check);
    item.onmousedown = () => { if (selectedTrackIds.size > 0) applyBulkTag(g.id); else toggleTag(g.id); input.value = ''; hideTagDropdown(); };
    dropdown.appendChild(item);
  });
  if (!matches.find(g => g.name.toLowerCase() === q)) {
    const create = document.createElement('div');
    create.style.cssText = 'padding:0.35rem 0.6rem;font-size:0.78rem;color:#f59e0b;cursor:pointer' + (matches.length ? ';border-top:1px solid #222' : '');
    create.textContent = `+ Create "${input.value.trim()}"`;
    create.onmousedown = () => { createAndTagGenre(input.value.trim()); input.value = ''; hideTagDropdown(); };
    dropdown.appendChild(create);
  }
  dropdown.style.display = 'block';
}

function showTagBubble(autoFocus = false) {
  if (!selectedTrackId && selectedTrackIds.size === 0) return;
  const bubble = document.getElementById('tag-bubble');
  if (bubble.style.display === 'block') return;
  bubble.style.display = 'block';
  bubble.classList.remove('visible');
  void bubble.offsetWidth;
  bubble.classList.add('visible');
  if (autoFocus) setTimeout(() => document.getElementById('tag-input').focus(), 50);
}

function hideTagBubble() {
  document.getElementById('tag-bubble').style.display = 'none';
  hideTagDropdown();
}

function hideTagDropdown() {
  const dd = document.getElementById('tag-dropdown');
  if (dd) dd.style.display = 'none';
}

function handleTagInput(e) {
  if (e.key === 'Escape') { hideTagBubble(); return; }
  if (e.key !== 'Enter') return;
  const input = document.getElementById('tag-input');
  const q = input.value.trim();
  if (!q || (!selectedTrackId && selectedTrackIds.size === 0)) return;
  const match = genres.find(g => g.name.toLowerCase() === q.toLowerCase());
  if (selectedTrackIds.size > 0) {
    if (match) applyBulkTag(match.id);
    else {
      const g = { id: Date.now().toString(), name: q, color: nextColor(), parentId: null };
      genres.push(g); renderGenreTree(); renderParentSelect();
      applyBulkTag(g.id);
    }
  } else {
    if (match) toggleTag(match.id);
    else createAndTagGenre(q);
  }
  input.value = ''; hideTagDropdown(); showTagDropdown();
}

function createAndTagGenre(name) {
  const g = { id: Date.now().toString(), name, color: nextColor(), parentId: null };
  genres.push(g);
  renderGenreTree(); renderParentSelect();
  toggleTag(g.id);
}

function toggleIncompleteDropdown() {
  const dd = document.getElementById('incomplete-dropdown');
  dd.style.display = dd.style.display === 'none' ? 'flex' : 'none';
}

function toggleIncompleteField(field) {
  if (incompleteFields.has(field)) incompleteFields.delete(field);
  else incompleteFields.add(field);
  document.querySelectorAll('.incomplete-pill').forEach(p => {
    p.classList.toggle('active', incompleteFields.has(p.dataset.field));
  });
  document.getElementById('incomplete-toggle').classList.toggle('active', incompleteFields.size > 0);
  selectedGenreFilter = new Set();
  updateResetBtn(); renderSongList(); renderGenreTree();
}

function filterByGenreExclusive(gid) {
  const onlyThis = selectedGenreFilter.size === 1 && selectedGenreFilter.has(gid);
  selectedGenreFilter = onlyThis ? new Set() : new Set([gid]);
  incompleteFields = new Set();
  document.getElementById('incomplete-toggle').classList.remove('active');
  document.querySelectorAll('.incomplete-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#genre-list .g-row[data-genre-id]').forEach(r => {
    r.classList.toggle('selected', selectedGenreFilter.has(r.dataset.genreId));
  });
  updateResetBtn();
  debouncedRenderSongList();
}

let _renderDebounceTimer = null;
function debouncedRenderSongList() {
  clearTimeout(_renderDebounceTimer);
  _renderDebounceTimer = setTimeout(renderSongList, 80);
}

function filterByGenre(gid) {
  if (selectedGenreFilter.has(gid)) selectedGenreFilter.delete(gid);
  else selectedGenreFilter.add(gid);
  incompleteFields = new Set();
  document.getElementById('incomplete-toggle').classList.remove('active');
  document.querySelectorAll('.incomplete-pill').forEach(p => p.classList.remove('active'));
  // Update genre row selected states instantly without rebuilding the tree
  document.querySelectorAll('#genre-list .g-row[data-genre-id]').forEach(r => {
    r.classList.toggle('selected', selectedGenreFilter.has(r.dataset.genreId));
  });
  updateResetBtn();
  debouncedRenderSongList();
}

function showAllSongs() {
  selectedGenreFilter = new Set(); incompleteFields = new Set();
  selectedYearFilter = new Set(); selectedCountryFilter = new Set(); selectedRegionFilter = new Set(); selectedEnergyFilter = new Set();
  document.getElementById('incomplete-toggle').classList.remove('active');
  document.querySelectorAll('.incomplete-pill').forEach(p => p.classList.remove('active'));
  document.getElementById('reset-filter-btn').style.display = 'none';
  renderSongList(); renderGenreTree();
  // Re-render open filter lists
  if (document.getElementById('year-filter-list').style.display !== 'none') renderYearFilter();
  if (document.getElementById('country-filter-list').style.display !== 'none') renderCountryFilter();
  if (document.getElementById('region-filter-list').style.display !== 'none') renderRegionFilter();
  if (document.getElementById('energy-filter-list').style.display !== 'none') renderEnergyFilter();
}

function updateResetBtn() {
  const visible = selectedGenreFilter.size > 0 || incompleteFields.size > 0 || selectedYearFilter.size > 0 || selectedCountryFilter.size > 0 || selectedRegionFilter.size > 0 || selectedEnergyFilter.size > 0;
  document.getElementById('reset-filter-btn').style.display = visible ? 'block' : 'none';
  document.getElementById('export-filter-btn').style.display = visible ? 'inline-block' : 'none';
  document.getElementById('status-user').style.display = visible ? 'none' : '';
}

// ── AUDIO FEATURES ──
function renderMeta(track) {
  const meta = trackMeta[track.id] || {};
  const suggestedYear = track.releaseDate ? track.releaseDate.slice(0, 4) : '';

  const yearInput = document.getElementById('year-input');
  const yearSuggest = document.getElementById('year-suggest');
  yearInput.value = meta.year || '';
  yearInput.placeholder = '—';
  if (suggestedYear && !meta.year) {
    yearSuggest.innerHTML = `Suggested: ${suggestedYear} · <span style="color:#f59e0b;cursor:pointer" onclick="acceptSuggestedYear('${track.id}','${suggestedYear}')">Accept</span>`;
  } else {
    yearSuggest.textContent = '';
  }
  yearInput.onchange = () => {
    const v = yearInput.value.trim();
    const targets = selectedTrackIds.size > 0 ? [...selectedTrackIds] : [track.id];
    targets.forEach(tid => {
      if (!trackMeta[tid]) trackMeta[tid] = {};
      trackMeta[tid].year = v;
    });
    yearSuggest.textContent = '';
    saveData();
    renderSongList();
  };

  document.getElementById('country-input').value = '';
  renderCountryTagChips(track.id);
  renderEnergySelector(track.id);
}

function acceptSuggestedYear(trackId, year) {
  if (!trackMeta[trackId]) trackMeta[trackId] = {};
  trackMeta[trackId].year = year;
  document.getElementById('year-input').value = year;
  document.getElementById('year-suggest').textContent = '';
  saveData();
}

function addCountry(trackId, country) {
  if (!trackMeta[trackId]) trackMeta[trackId] = {};
  if (!trackMeta[trackId].countries) trackMeta[trackId].countries = [];
  if (!trackMeta[trackId].countries.includes(country)) {
    trackMeta[trackId].countries.push(country);
    saveData();
    renderCountryTagChips(trackId);
    renderSongList();
    if (document.getElementById('country-filter-list').style.display !== 'none') renderCountryFilter();
  }
  document.getElementById('country-input').value = '';
  hideCountryDropdown();
}

function removeCountry(trackId, country) {
  if (!trackMeta[trackId]?.countries) return;
  trackMeta[trackId].countries = trackMeta[trackId].countries.filter(c => c !== country);
  saveData();
  renderCountryTagChips(trackId);
  renderSongList();
  if (document.getElementById('country-filter-list').style.display !== 'none') renderCountryFilter();
}

function renderCountryTagChips(trackId) {
  const container = document.getElementById('country-tags');
  const input = document.getElementById('country-input');
  // Remove only chip elements, leave the input
  Array.from(container.children).forEach(el => { if (el !== input) el.remove(); });
  const countries = trackMeta[trackId]?.countries || [];
  countries.forEach(c => {
    const chip = document.createElement('span');
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;padding:2px 6px;background:#111;border:1px solid #2a2a2a;border-radius:8px;color:#aaa;flex-shrink:0';
    const label = document.createElement('span'); label.textContent = c;
    const del = document.createElement('span');
    del.textContent = '×'; del.style.cssText = 'cursor:pointer;color:#555;line-height:1';
    del.onmouseover = () => del.style.color = '#c0392b';
    del.onmouseout = () => del.style.color = '#555';
    del.onclick = () => removeCountry(trackId, c);
    chip.append(label, del);
    container.insertBefore(chip, input);
  });
}

function bulkCountryTypeahead(input) {
  const q = input.value;
  if (!q) return;
  const match = COUNTRIES.find(c => c.toLowerCase().startsWith(q.toLowerCase()));
  if (!match) return;
  const start = q.length;
  input.value = match;
  input.setSelectionRange(start, match.length);
}

function hideBulkCountryDropdown() {}

function handleBulkCountryInput(e) {
  if (e.key === 'Backspace' || e.key === 'Delete') return;
  if (e.key !== 'Enter') return;
  const input = document.getElementById('bulk-country');
  const q = input.value.trim();
  if (!q) return;
  const match = COUNTRIES.find(c => c.toLowerCase() === q.toLowerCase());
  if (match) applyBulkCountry(match);
}

function showCountryDropdown() {
  if (!selectedTrackId) return;
  const input = document.getElementById('country-input');
  const dropdown = document.getElementById('country-dropdown');
  const q = input.value.toLowerCase().trim();
  const existing = trackMeta[selectedTrackId]?.countries || [];
  const matches = COUNTRIES.filter(c => !existing.includes(c) && (!q || c.toLowerCase().includes(q))).slice(0, 12);
  dropdown.innerHTML = '';
  matches.forEach(c => {
    const item = document.createElement('div');
    item.style.cssText = 'padding:0.32rem 0.6rem;font-size:0.8rem;cursor:pointer;color:#bbb';
    item.textContent = c;
    item.onmouseover = () => item.style.background = '#1a1a1a';
    item.onmouseout = () => item.style.background = '';
    item.onmousedown = () => addCountry(selectedTrackId, c);
    dropdown.appendChild(item);
  });
  dropdown.style.display = matches.length ? 'block' : 'none';
}

function hideCountryDropdown() {
  const dd = document.getElementById('country-dropdown');
  if (dd) dd.style.display = 'none';
}

function handleCountryInput(e) {
  if (e.key !== 'Enter') return;
  const q = document.getElementById('country-input').value.trim();
  if (!q || !selectedTrackId) return;
  // Exact match first, then first visible dropdown item
  const exact = COUNTRIES.find(c => c.toLowerCase() === q.toLowerCase());
  if (exact) { addCountry(selectedTrackId, exact); return; }
  const first = document.querySelector('#country-dropdown div');
  if (first) addCountry(selectedTrackId, first.textContent);
}

// ── SUGGESTIONS ──
async function fetchLastFmGenres(artistName) {
  const cacheKey = 'lfm:' + artistName;
  if (artistGenreCache[cacheKey] !== undefined) return artistGenreCache[cacheKey];
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const tags = (data.toptags?.tag || []).filter(t => parseInt(t.count) > 0).slice(0, 12).map(t => t.name.toLowerCase());
    artistGenreCache[cacheKey] = tags;
    return tags;
  } catch(e) { artistGenreCache[cacheKey] = []; return []; }
}

async function fetchArtistGenres(track) {
  const ids = track.artistIds?.length ? track.artistIds : (track.artistId ? [track.artistId] : []);
  const allGenres = new Set();

  // Spotify artist genres
  for (const id of ids) {
    if (artistGenreCache[id] === undefined) {
      try {
        const data = await api('/artists/' + id);
        artistGenreCache[id] = data?.genres || [];
      } catch(e) { artistGenreCache[id] = []; }
    }
    artistGenreCache[id].forEach(g => allGenres.add(g));
  }

  // Last.fm tags — merged with Spotify
  const primaryArtist = track.artist.split(',')[0].trim();
  const lfmGenres = await fetchLastFmGenres(primaryArtist);
  lfmGenres.forEach(g => allGenres.add(g));

  return [...allGenres];
}

function renderSuggestions(spotifyGenres, trackId) {
  document.getElementById('suggestions-loading').style.display = 'none';
  const list = document.getElementById('suggestions-list');
  list.innerHTML = '';
  if (!spotifyGenres || spotifyGenres.length === 0) {
    list.innerHTML = '<div style="font-size:0.75rem;color:#444;padding:0.2rem 0">No suggestions found</div>';
    return;
  }
  spotifyGenres.slice(0, 6).forEach(genre => list.appendChild(buildSuggestionItem(genre, trackId)));
}

function buildSuggestionItem(genre, trackId) {
  const mapped = genreMappings[genre];
  const customGenre = mapped && mapped !== 'skip' ? getGenre(mapped) : null;
  const isApplied = trackId && customGenre && (tags[trackId]||[]).includes(mapped);

  const item = document.createElement('div'); item.className = 'sugg-item';
  const left = document.createElement('div'); left.className = 'sugg-left';
  const nameEl = document.createElement('div'); nameEl.className = 'sugg-genre-name'; nameEl.textContent = genre;
  left.appendChild(nameEl);

  if (mapped === 'skip') {
    const s = document.createElement('div');
    s.style.cssText = 'font-size:0.68rem;color:#444;margin-top:2px';
    s.textContent = 'skipped'; left.appendChild(s);
  }

  const btns = document.createElement('div'); btns.className = 'sugg-btns';

  const refreshItem = () => {
    const parent = item.parentElement;
    const next = item.nextSibling;
    item.remove();
    parent.insertBefore(buildSuggestionItem(genre, trackId), next);
  };

  if (isApplied) {
    const doneBtn = document.createElement('button');
    doneBtn.className = 'sugg-btn applied'; doneBtn.textContent = '✓ Added'; doneBtn.disabled = true;
    btns.appendChild(doneBtn);
  } else {
    const addBtn = document.createElement('button'); addBtn.className = 'sugg-btn green'; addBtn.textContent = '+ Add';
    addBtn.onclick = () => { addDirectly(genre, trackId); refreshItem(); };
    btns.appendChild(addBtn);
  }

  item.append(left, btns);
  return item;
}

function applyMapping(customGenreId, trackId) {
  if (!trackId) return;
  if (!tags[trackId]) tags[trackId] = [];
  if (!tags[trackId].includes(customGenreId)) tags[trackId].push(customGenreId);
  saveData(); renderCurrentTags(); renderSongList(); updateStats();
}

function addDirectly(spotifyGenre, trackId) {
  const existingId = genreMappings[spotifyGenre];
  const existingGenre = existingId && existingId !== 'skip' ? getGenre(existingId) : null;
  if (existingGenre) { applyMapping(existingGenre.id, trackId); return; }
  const normalized = spotifyGenre.toLowerCase();
  let g = genres.find(g => g.name.toLowerCase() === normalized);
  if (!g) {
    g = { id: Date.now().toString(), name: spotifyGenre, color: nextColor(), parentId: null };
    genres.push(g);
    renderGenreTree();
    renderParentSelect();
  }
  genreMappings[spotifyGenre] = g.id;
  applyMapping(g.id, trackId);
  saveData();
}

function toggleMappingPicker(item, spotifyGenre, trackId, onPick) {
  const existing = item.querySelector('.mapping-picker');
  if (existing) { existing.remove(); return; }
  const picker = document.createElement('div'); picker.className = 'mapping-picker';

  const buildItems = (list, depth) => {
    list.forEach(g => {
      const mitem = document.createElement('div'); mitem.className = 'm-item';
      mitem.style.paddingLeft = (0.5 + depth * 0.9) + 'rem';
      const dot = document.createElement('span'); dot.className = 'm-dot'; dot.style.background = g.color;
      const label = document.createElement('span'); label.textContent = getGenrePath(g.id);
      mitem.append(dot, label);
      mitem.onclick = () => {
        genreMappings[spotifyGenre] = g.id;
        applyMapping(g.id, trackId);
        saveData();
        onPick();
      };
      picker.appendChild(mitem);
      buildItems(genres.filter(g2 => g2.parentId === g.id), depth + 1);
    });
  };
  buildItems(genres.filter(g => !g.parentId), 0);

  // "Create new genre" row at the bottom
  const divider = document.createElement('div');
  divider.style.cssText = 'border-top:1px solid #222;margin:0.3rem 0';
  picker.appendChild(divider);

  const newRow = document.createElement('div');
  newRow.style.cssText = 'display:flex;align-items:center;gap:0.3rem;padding:0.3rem 0.5rem';

  const input = document.createElement('input');
  input.placeholder = 'New genre name...';
  input.style.cssText = 'flex:1;background:#111;border:1px solid #2a2a2a;border-radius:4px;padding:0.25rem 0.4rem;color:#eee;font-size:0.75rem;outline:none;min-width:0';
  input.onfocus = () => input.style.borderColor = '#f59e0b';
  input.onblur = () => input.style.borderColor = '#2a2a2a';

  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.style.cssText = 'background:#f59e0b;color:#000;border:none;border-radius:4px;padding:0.25rem 0.5rem;font-size:0.78rem;font-weight:700;flex-shrink:0';

  const createAndApply = () => {
    const name = input.value.trim();
    if (!name) return;
    const newGenre = { id: Date.now().toString(), name, color: nextColor(), parentId: null };
    genres.push(newGenre);
    genreMappings[spotifyGenre] = newGenre.id;
    applyMapping(newGenre.id, trackId);
    saveData();
    renderGenreTree();
    renderParentSelect();
    onPick();
  };

  addBtn.onclick = createAndApply;
  input.onkeydown = e => { if (e.key === 'Enter') createAndApply(); };

  newRow.append(input, addBtn);
  picker.appendChild(newRow);

  item.appendChild(picker);
  setTimeout(() => input.focus(), 50);
}

// ── TRACK SELECTION ──
function selectTrack(id) {
  stopAudio();
  if (selectedTrackIds.size > 0) { selectedTrackIds.clear(); renderBulkBar(); }
  selectedTrackId = id;
  // Reset remove button state on track switch
  const removeBtn = document.getElementById('remove-track-btn');
  if (removeBtn) {
    removeBtn.textContent = '✕ Remove';
    removeBtn.style.color = '#555';
    removeBtn.style.borderColor = '#2a2a2a';
    removeBtn.dataset.confirming = 'false';
  }
  const t = tracks.find(x => x.id === id);
  if (!t) return;

  document.getElementById('no-song-msg').style.display = 'none';
  document.getElementById('song-detail').style.display = 'block';
  document.getElementById('detail-art').src = t.art;
  document.getElementById('detail-title').textContent = t.title;
  const artistEl = document.getElementById('detail-artist');
  artistEl.innerHTML = '';
  t.artist.split(',').map(a => a.trim()).forEach((name, i, arr) => {
    const span = document.createElement('span');
    span.textContent = name;
    span.title = 'Click to copy';
    span.style.cssText = 'cursor:pointer;color:#888;white-space:nowrap';
    span.onmouseover = () => span.style.color = '#bbb';
    span.onmouseout = () => span.style.color = '#888';
    span.onclick = () => navigator.clipboard.writeText(name).then(() => {
      const orig = span.textContent; span.textContent = 'Copied!'; span.style.color = '#f59e0b';
      setTimeout(() => { span.textContent = orig; span.style.color = '#888'; }, 1200);
    });
    artistEl.appendChild(span);
    if (i < arr.length - 1) {
      const sep = document.createElement('span');
      sep.textContent = ','; sep.style.color = '#555';
      artistEl.appendChild(sep);
    }
  });
  const primaryArtist = t.artist.split(',')[0].trim();
  document.getElementById('discogs-btn').href =
    'https://www.discogs.com/search/?q=' + encodeURIComponent(primaryArtist);
  document.getElementById('wikipedia-btn').href =
    'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(primaryArtist);
  document.getElementById('rym-btn').href =
    'https://rateyourmusic.com/search?searchterm=' + encodeURIComponent(primaryArtist) + '&searchtype=a';
  const playBtn = document.getElementById('spotify-play-btn');
  if (unavailableIds.has(t.id) || takenDownIds.has(t.id)) {
    playBtn.removeAttribute('href');
    playBtn.style.pointerEvents = 'none';
    playBtn.style.color = '#333';
    playBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg> No longer on Spotify';
  } else {
    playBtn.href = 'spotify:track:' + t.id;
    playBtn.style.pointerEvents = '';
    playBtn.style.color = '';
    playBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg> Play on Spotify';
  }

  const audioBar = document.querySelector('.audio-bar');
  if (t.preview_url) {
    audio.src = t.preview_url; audioBar.style.display = 'flex';
  } else {
    audio.src = ''; audioBar.style.display = 'none';
  }
  document.getElementById('audio-btn').textContent = '▶';
  document.getElementById('audio-fill').style.width = '0%';
  document.getElementById('audio-time').textContent = '0:00';

  renderCurrentTags(); renderMeta(t); showTagBubble(); updateFlagBtn(id);
  document.querySelectorAll('#song-list .song-row').forEach(r => {
    r.classList.toggle('active', r.dataset.trackId === id);
    r.classList.remove('bulk-selected');
  });

  document.getElementById('suggestions-loading').style.display = 'block';
  document.getElementById('suggestions-list').innerHTML = '';
  fetchArtistGenres(t).then(g => renderSuggestions(g, id));
}

function renderCurrentTags() {
  const container = document.getElementById('current-tags');
  const songTags = tags[selectedTrackId] || [];
  if (songTags.length === 0) {
    container.innerHTML = '<span style="font-size:0.75rem;color:#444">No tags yet</span>'; return;
  }
  container.innerHTML = '';
  [...songTags]
    .sort((a, b) => getTrackCountForGenre(b) - getTrackCountForGenre(a))
    .forEach(gid => {
      const g = getGenre(gid); if (!g) return;
      const chip = document.createElement('span'); chip.className = 'tag-chip-big';
      chip.style.color = g.color; chip.style.borderColor = g.color + '66';
      chip.innerHTML = `${getGenrePath(gid)} <button class="remove-tag" onclick="removeTag('${gid}')">✕</button>`;
      container.appendChild(chip);
    });
}

function renderGenrePicker() {}
function renderPickerItem() {}

function toggleTag(gid) {
  if (!selectedTrackId) return;
  if (!tags[selectedTrackId]) tags[selectedTrackId] = [];
  const idx = tags[selectedTrackId].indexOf(gid);
  if (idx > -1) tags[selectedTrackId].splice(idx, 1);
  else tags[selectedTrackId].push(gid);
  saveData(); renderCurrentTags(); renderGenreTree(); renderSongList(); updateStats();
  // Refresh suggestions so applied state updates
  if (selectedTrackId) {
    const t = tracks.find(x => x.id === selectedTrackId);
    if (t && artistGenreCache[t.artistId]) renderSuggestions(artistGenreCache[t.artistId], selectedTrackId);
  }
}

function removeTag(gid) { toggleTag(gid); }

// ── REVIEW MODE ──
function startReview() {
  reviewQueue = tracks.filter(t => !isFullyTagged(t.id));
  if (!reviewQueue.length) { setStatus('No untagged songs to review'); return; }
  reviewIndex = 0; reviewMode = true;
  incompleteFields = new Set(['genre', 'year', 'country', 'energy']);
  document.getElementById('incomplete-toggle').classList.add('active');
  document.querySelectorAll('.incomplete-pill').forEach(p => p.classList.add('active'));
  renderSongList(); updateReviewBar();
  selectTrack(reviewQueue[0].id);
  setTimeout(() => { if (audio.src) { audio.play(); document.getElementById('audio-btn').textContent = '⏸'; } }, 400);
}

function nextReview() {
  reviewIndex++;
  if (reviewIndex >= reviewQueue.length) { endReview(); return; }
  selectTrack(reviewQueue[reviewIndex].id);
  setTimeout(() => { if (audio.src) { audio.play(); document.getElementById('audio-btn').textContent = '⏸'; } }, 400);
  updateReviewBar();
}

function endReview() {
  reviewMode = false; reviewQueue = []; reviewIndex = 0;
  updateReviewBar(); setStatus('Review complete');
}

function updateReviewBar() {
  const bar = document.getElementById('review-bar');
  if (reviewMode) {
    bar.style.display = 'flex';
    document.getElementById('review-prog').textContent = `${reviewIndex + 1} of ${reviewQueue.length}`;
  } else {
    bar.style.display = 'none';
  }
}

// ── AUDIO ──
audio.addEventListener('timeupdate', () => {
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  document.getElementById('audio-fill').style.width = pct + '%';
  const s = Math.floor(audio.currentTime);
  document.getElementById('audio-time').textContent = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
});

audio.addEventListener('ended', () => {
  document.getElementById('audio-btn').textContent = '▶';
  if (reviewMode) nextReview();
});

function togglePlay() {
  if (audio.paused) { audio.play(); document.getElementById('audio-btn').textContent = '⏸'; }
  else { audio.pause(); document.getElementById('audio-btn').textContent = '▶'; }
}

function stopAudio() { audio.pause(); audio.src = ''; document.getElementById('audio-btn').textContent = '▶'; }

function seekAudio(e) {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
}

// ── EXPORT ──
// ── HAMBURGER MENU ──
function toggleHamburgerMenu() {
  document.getElementById('hamburger-menu').classList.toggle('open');
}
function closeHamburgerMenu() {
  document.getElementById('hamburger-menu').classList.remove('open');
}
document.addEventListener('click', e => {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) closeHamburgerMenu();
});

// ── UNSTREAMABLE MODAL ──
function showUnstreamableModal() {
  document.getElementById('unstreamable-modal').classList.add('open');
  renderUnstreamableList();
}
function hideUnstreamableModal() {
  document.getElementById('unstreamable-modal').classList.remove('open');
}
function renderUnstreamableList() {
  const list = document.getElementById('unstreamable-list');
  if (!list) return;
  const unavailable = tracks.filter(t => unavailableIds.has(t.id));
  const takenDown = tracks.filter(t => takenDownIds.has(t.id));
  if (!unavailable.length && !takenDown.length) {
    list.innerHTML = '<div style="font-size:0.78rem;color:#555;text-align:center;padding:1.5rem 0">No unavailable tracks detected yet.<br><span style="font-size:0.68rem">Re-sync your library to check.</span></div>';
    return;
  }
  list.innerHTML = '';

  const buildRow = (t, hasArt) => {
    const row = document.createElement('div');
    row.style.cssText = 'padding:0.55rem 0;border-bottom:1px solid #1e1e1e;display:flex;gap:0.6rem;align-items:center';
    if (hasArt && t.art) {
      const img = document.createElement('img');
      img.src = t.art; img.style.cssText = 'width:36px;height:36px;border-radius:4px;object-fit:cover;flex-shrink:0;opacity:0.5';
      row.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.style.cssText = 'width:36px;height:36px;border-radius:4px;background:#1a1a1a;flex-shrink:0;border:1px solid #2a2a2a';
      row.appendChild(ph);
    }
    const info = document.createElement('div'); info.style.cssText = 'flex:1;min-width:0';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:0.82rem;color:#555;text-decoration:line-through;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    title.textContent = t.title;
    const artist = document.createElement('div');
    artist.style.cssText = 'font-size:0.72rem;color:#3a3a3a;margin-top:1px';
    artist.textContent = t.artist;
    const links = document.createElement('div');
    links.style.cssText = 'display:flex;gap:0.35rem;margin-top:0.25rem';
    const primaryArtist = t.artist.split(',')[0].trim();
    const q = encodeURIComponent(primaryArtist + ' ' + t.title);
    [['discogs', 'https://www.discogs.com/search/?q=' + q], ['google', 'https://www.google.com/search?q=' + q]].forEach(([label, href]) => {
      const a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.textContent = label + ' ↗'; a.className = 'detail-link';
      links.appendChild(a);
    });
    info.append(title, artist, links);
    row.appendChild(info);
    return row;
  };

  if (unavailable.length) {
    const heading = document.createElement('div');
    heading.style.cssText = 'font-size:0.62rem;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:0.4rem';
    heading.textContent = 'Currently Unavailable';
    list.appendChild(heading);
    unavailable.forEach(t => list.appendChild(buildRow(t, true)));
  }

  if (takenDown.length) {
    const heading = document.createElement('div');
    heading.style.cssText = 'font-size:0.62rem;text-transform:uppercase;letter-spacing:1px;color:#555;margin-top:' + (unavailable.length ? '1rem' : '0') + ';margin-bottom:0.4rem';
    heading.textContent = 'Taken Down';
    list.appendChild(heading);
    takenDown.forEach(t => list.appendChild(buildRow(t, false)));
  }
}
document.getElementById('unstreamable-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('unstreamable-modal')) hideUnstreamableModal();
});

function resyncLibrary() {
  setStatus('Re-syncing library...');
  loadMoreTracks(true);
}

function showBackupModal() { document.getElementById('export-modal').classList.add('open'); }
function showExportModal() { showBackupModal(); }

function hideExportModal() { document.getElementById('export-modal').classList.remove('open'); }

document.getElementById('export-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('export-modal')) hideExportModal();
});

function renderExportList() {
  const list = document.getElementById('export-list');
  list.innerHTML = '';
  genres.forEach(g => {
    const count = getTrackCountForGenre(g.id);
    if (!count) return;
    const row = document.createElement('div'); row.className = 'export-row';
    row.innerHTML = `
      <div class="export-row-info">
        <div style="width:7px;height:7px;border-radius:50%;background:${g.color};flex-shrink:0"></div>
        <div><div style="font-size:0.8rem">${getGenrePath(g.id)}</div><div style="font-size:0.68rem;color:#555">${count} songs</div></div>
      </div>
      <button class="btn-outline btn-sm" onclick="exportPlaylist('${g.id}')">→ Spotify</button>`;
    list.appendChild(row);
  });
  if (!list.children.length) list.innerHTML = '<div style="color:#555;font-size:0.8rem;padding:0.5rem 0">No tagged songs yet</div>';
}

async function exportPlaylist(gid) {
  const g = getGenre(gid);
  const trackIds = tracks.filter(t => (tags[t.id]||[]).includes(gid)).map(t => t.id);
  if (!trackIds.length) return;
  setStatus(`Creating "${g.name}"...`);
  try {
    const me = await api('/me');
    const pl = await api(`/me/playlists`, 'POST', { name: `objectsort: ${getGenrePath(gid)}`, description: 'Created by objectsort', public: false });
    await new Promise(r => setTimeout(r, 1500));
    for (let i = 0; i < trackIds.length; i += 100)
      await api(`/playlists/${pl.id}/tracks`, 'POST', { uris: trackIds.slice(i,i+100).map(id=>`spotify:track:${id}`) });
    setStatus(`✓ "${g.name}" created with ${trackIds.length} songs`);
  } catch(e) { setStatus('Error: ' + e.message); }
}

async function exportAllPlaylists() {
  const tagged = genres.filter(g => getTrackCountForGenre(g.id) > 0);
  for (const g of tagged) await exportPlaylist(g.id);
  setStatus(`✓ Exported ${tagged.length} playlists`);
}

let _isExporting = false;
async function exportFilteredPlaylist() {
  if (_isExporting) return;
  const visible = getVisibleTracks();
  if (!visible.length) { setStatus('No tracks match current filters'); return; }
  const parts = [];
  if (selectedGenreFilter.size > 0)
    [...selectedGenreFilter].forEach(gid => { const g = getGenre(gid); if (g) parts.push(g.name); });
  if (selectedYearFilter.size > 0) parts.push([...selectedYearFilter].join('/'));
  if (selectedCountryFilter.size > 0) parts.push([...selectedCountryFilter].join('/'));
  if (selectedRegionFilter.size > 0) parts.push([...selectedRegionFilter].join('/'));
  if (selectedEnergyFilter.size > 0) parts.push([...selectedEnergyFilter].map(l => ENERGY_LABELS[l]).join('/'));
  if (incompleteFields.size > 0) parts.push('Missing ' + [...incompleteFields].join('+'));
  const q = document.getElementById('search-input').value.trim();
  if (q) parts.push(`"${q}"`);
  const name = `objectsort: ${parts.join(' + ') || 'filtered'} (${visible.length})`;
  const btn = document.getElementById('export-filter-btn');
  _isExporting = true;
  btn.disabled = true; btn.textContent = 'Exporting...';
  try {
    const me = await api('/me');
    if (!me) throw new Error('Could not fetch Spotify profile — try logging out and back in');
    console.log('[export] me:', me.id, 'product:', me.product);
    const pl = await api(`/me/playlists`, 'POST', { name, description: 'Exported from objectsort', public: true });
    if (!pl || !pl.id) throw new Error('Playlist creation failed — Spotify returned no playlist ID');
    await new Promise(r => setTimeout(r, 1500));
    const uris = visible.map(t => `spotify:track:${t.id}`).filter(u => !u.includes('null') && !u.includes('undefined'));
    console.log('[export] playlist id:', pl.id, 'track count:', uris.length, 'first uri:', uris[0]);
    for (let i = 0; i < uris.length; i += 100) {
      const batch = uris.slice(i, i + 100);
      console.log('[export] adding batch', i/100 + 1, 'size:', batch.length);
      const res = await fetch(`https://api.spotify.com/v1/playlists/${pl.id}/tracks`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ACCESS_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: batch })
      });
      console.log('[export] batch response:', res.status, res.statusText);
      if (!res.ok) { const txt = await res.text(); console.error('[export] batch error:', txt); throw new Error(txt); }
    }
    setStatus(`✓ "${name}" created with ${visible.length} tracks`);
  } catch(e) {
    console.error('[export] failed:', e);
    setStatus('Export failed: ' + e.message);
  }
  _isExporting = false;
  btn.disabled = false; btn.textContent = '↗ Export Filtered View';
}

function downloadBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    genres,
    tags,
    tracks,
    genreMappings,
    trackMeta,
    currentOffset,
    totalTracks,
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  a.download = `objectsort-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function restoreBackup(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById('restore-status');
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.version || !backup.genres || !backup.tracks) throw new Error('Invalid backup file');
      if (!confirm(`This will replace all your current data with the backup from ${backup.exportedAt?.slice(0,10) || 'unknown date'} (${backup.tracks.length.toLocaleString()} tracks, ${backup.genres.length} genres). Continue?`)) {
        input.value = ''; return;
      }
      genres = backup.genres || [];
      tags = backup.tags || {};
      tracks = backup.tracks || [];
      genreMappings = backup.genreMappings || {};
      trackMeta = backup.trackMeta || {};
      currentOffset = backup.currentOffset || tracks.length;
      totalTracks = backup.totalTracks || tracks.length;
      // Migrate countries if needed
      Object.values(trackMeta).forEach(m => {
        if (m.country !== undefined && !m.countries) { m.countries = m.country ? [m.country] : []; delete m.country; }
        if (!m.countries) m.countries = [];
      });
      colorIdx = genres.length % COLORS.length;
      saveData();
      renderGenreTree(); renderParentSelect(); renderSongList(); updateStats(); updateLibraryBar();
      statusEl.style.display = 'block';
      statusEl.style.color = '#f59e0b';
      statusEl.textContent = `✓ Restored ${tracks.length.toLocaleString()} tracks and ${genres.length} genres`;
      setStatus('Backup restored successfully');
    } catch(err) {
      statusEl.style.display = 'block';
      statusEl.style.color = '#e74c3c';
      statusEl.textContent = 'Error: ' + err.message;
    }
    input.value = '';
  };
  reader.readAsText(file);
}

function downloadCSV() {
  const rows = [['Track ID','Title','Artist','Album','Tags']];
  tracks.forEach(t => {
    const songTags = (tags[t.id]||[]).map(gid => getGenrePath(gid)).join(' | ');
    rows.push([t.id, `"${t.title.replace(/"/g,'""')}"`, `"${t.artist.replace(/"/g,'""')}"`, `"${t.album.replace(/"/g,'""')}"`, `"${songTags}"`]);
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'}));
  a.download = 'objectsort-tags.csv'; a.click();
}

// ── STATS / UTILS ──
function updateStats() {
  const tagged = tracks.filter(t => isFullyTagged(t.id)).length;
  document.getElementById('stat-tagged').textContent = tagged.toLocaleString();
  document.getElementById('stat-untagged').textContent = (tracks.length - tagged).toLocaleString();
  updateLibraryBar();
}

function copyArtist(el) {
  navigator.clipboard.writeText(el.textContent).then(() => {
    const orig = el.textContent;
    el.textContent = 'Copied!';
    el.style.color = '#f59e0b';
    setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1200);
  });
}

function setStatus(msg) { document.getElementById('status-msg').textContent = msg; }
function setProgress(pct) {
  const bar = document.getElementById('status-loading-bar');
  if (!bar) return;
  bar.style.width = pct + '%';
  bar.style.opacity = pct > 0 && pct < 100 ? '1' : '0';
}

// ── STAT TICKER ──
let _tickerCleanup = null;

function buildTickerFacts(totalHours) {
  const h = totalHours;
  const fmt = n => n >= 10 ? Math.round(n).toLocaleString() : n.toFixed(1).replace(/\.0$/, '');
  const pct = n => (n * 100).toFixed(1) + '%';
  const yr = new Date().getFullYear();

  return [
    `Logistics is a 2012 Swedish art film that documents, in real time, a pedometer making its journey from a store in Stockholm to a factory in China — played entirely in reverse. There is no dialogue. There are no characters. It runs 857 hours. Listening to your library back-to-back would get you ${pct(h / 857)} of the way through it.`,
    `In 2001, a pipe organ in Halberstadt, Germany began performing a piece by John Cage designed to last 639 years. The next scheduled note change is in 2040. Everyone alive today who has heard it will be dead before it ends. By the time it finishes, you could have listened to your entire library ${fmt((639 * 8760) / h)} times.`,
    `The Mousetrap is Agatha Christie's murder mystery — it has been running continuously in London's West End since 1952, making it the longest-running stage production in history. The identity of the killer has been kept secret for over 70 years by a gentleman's agreement with the audience, who are asked at the end not to spoil it. Since opening night, you could have listened to your entire library ${fmt(((yr - 1952) * 8760) / h)} times before tonight's curtain call.`,
    `In 1927, a professor at the University of Queensland set up an experiment to demonstrate that tar pitch — which appears solid — is actually a liquid. Only 9 drops have fallen since. The experiment has outlived every scientist who ever worked on it. You could listen to your entire library ${fmt((10 * 8760) / h)} times while a single drop falls.`,
    `In 2010, John Isner and Nicolas Mahut played the longest tennis match in recorded history across three days at Wimbledon. The final set alone lasted 8 hours and 11 minutes. Mahut lost — and then, the following morning, lost again in the first round of doubles. You could listen to your entire library ${fmt(h / 11.08)} times in the duration of that match.`,
    `The Oxford Electric Bell has been ringing continuously since 1840 — making it one of the longest-running experiments in scientific history. It has rung an estimated 10 billion times. No one has ever opened it to see what's inside, because doing so would end the experiment. Nobody knows when the battery will die. You could listen to your entire library ${fmt(((yr - 1840) * 8760) / h)} times before the bell catches up to today.`,
    `The Cure for Insomnia is a 1987 experimental film consisting entirely of a man named L.D. Groban reading his 4,080-page poem — accompanied by intermittent heavy metal. It was screened once, in full, at the Art Institute of Chicago. It is not available to stream. You could listen to your entire library ${fmt(h / 87)} times in its runtime.`,
    `Wagner's Ring Cycle is a series of four operas composed over 26 years, intended to be performed across four consecutive nights. Wagner also designed and built a dedicated theatre in Bayreuth, Germany specifically for its performance — it has been staging the cycle every summer since 1876. You could listen to your entire library ${fmt(h / 15)} times across those four nights.`,
    `In 1989, Ivan Nikolic and Goran Arsovic sat down for a chess match in Belgrade that lasted 20 hours and 15 minutes across 269 moves. The game was so long it required a rule change — the draw-by-repetition rule was introduced partly because of it. When it was over, they agreed to a draw. You could listen to your entire library ${fmt(h / 20.25)} times in the time it took to play.`,
    `Hiroo Onoda was a Japanese soldier stationed in the Philippine jungle during WWII. When the war ended in 1945, nobody told him. He kept fighting — conducting guerrilla operations and living off the land — until 1974, when his former commanding officer flew in personally to relieve him of duty. During those 29 years, you could have listened to your entire library ${fmt((29 * 8760) / h)} times.`,
    `Elaine Esposito fell into a coma during a routine appendix operation in 1941. She was six years old. She never woke up. She died 37 years and 111 days later — still unconscious, still breathing — setting a record that has never been broken. You could have listened to your entire library ${fmt(((37 + 111/365) * 8760) / h)} times.`,
    `Jonathan is a Seychelles giant tortoise currently living on the island of Saint Helena. He is estimated to have been born around 1832, making him approximately ${yr - 1832} years old — the oldest known living land animal on earth. A photograph taken in 1886 shows him already fully grown at his current size. He is now blind and has lost his sense of smell, but still responds to the sound of his keeper's voice at feeding time. You could listen to your entire library ${fmt(((yr - 1832) * 8760) / h)} times in the span of his life so far.`,
    `Tsutomu Yamaguchi was in Hiroshima on August 6, 1945, for a business trip when the first atomic bomb dropped. He survived with burns, spent the night in the city, and returned home to Nagasaki the next morning. Three days later, the second bomb dropped. He survived that too, lived to 93, and spent the rest of his life as an anti-nuclear activist. Japan officially recognized him as a survivor of both bombings in 2009 — 64 years after the fact. You could have listened to your entire library ${fmt((64 * 8760) / h)} times before the paperwork went through.`,
    `Henry Darger worked as a janitor and hospital porter in Chicago for most of his life. He ate alone, attended mass up to five times a day, and spoke to almost no one. When he moved to a nursing home in 1972, his landlord went to clean out his room and found a 15,145-page illustrated novel — the longest known work of fiction ever created — stacked in the corner. Darger never showed it to anyone. He died four months later. You could read it aloud continuously for ${fmt(15145 / 250 / h)} times the length of your library.`,
    `The papal conclave of 1268 was called to elect a new pope after the death of Clement IV. The cardinals could not agree. After a year, the local government locked them in the palace. After two years, they reduced their food to bread and water. After two and a half years, they removed the roof. The cardinals elected Gregory X after 1,006 days — the longest papal vacancy in history — and then immediately wrote the rules that govern conclaves to this day. You could have listened to your entire library ${fmt((1006 * 24) / h)} times in the time it took them to decide.`,
    `The Marathon monks of Mount Hiei undergo a practice called kaihōgyō — running the equivalent of a marathon every day for 100 consecutive days, repeated across seven years, totaling over 25,000 miles. That distance is roughly one full circumference of the earth. Since the practice was formalized in the 19th century, fewer than 50 men have ever completed it. You could listen to your entire library ${fmt((25000 / 60) / h)} times in the hours it would take to drive that same distance without stopping.`,
  ].sort(() => Math.random() - 0.5);
}

function startStatTicker() {
  if (_tickerCleanup) return; // already running
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  if (totalMs === 0) return;
  const totalHours = totalMs / 3600000;
  if (totalHours < 50) return;
  const facts = buildTickerFacts(totalHours);
  const ticker = document.getElementById('stat-ticker');
  const track = document.getElementById('stat-ticker-track');
  if (!ticker || !track) return;

  // All facts in one continuous crawl, separated by a spacer
  track.textContent = facts.join('                                        ※                                        ');
  ticker.style.display = 'block';

  // Click anywhere on ticker to collapse/expand
  ticker.addEventListener('click', () => ticker.classList.toggle('collapsed'));

  requestAnimationFrame(() => {
    const containerW = ticker.offsetWidth;
    const textW = track.scrollWidth;
    const pxPerSec = 13; // glacial pace
    const durationMs = Math.round((containerW + textW) / pxPerSec * 1000);

    function scroll() {
      track.style.transition = 'none';
      track.style.transform = `translateX(${containerW}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        track.style.transition = `transform ${durationMs}ms linear`;
        track.style.transform = `translateX(-${textW}px)`;
      }));
    }

    track.addEventListener('transitionend', scroll);
    scroll();
    _tickerCleanup = () => track.removeEventListener('transitionend', scroll);
  });
}

function stopStatTicker() {
  if (_tickerCleanup) { _tickerCleanup(); _tickerCleanup = null; }
  const ticker = document.getElementById('stat-ticker');
  if (ticker) ticker.style.display = 'none';
}

function updateLibraryBar() {
  // Library bar removed from HTML — this is now a no-op kept for call-site compatibility
}

// ── TAG COPY / PASTE ──
let _copiedTags = null;

function copyTagsFromSelected() {
  if (!selectedTrackId) return;
  const songTags = tags[selectedTrackId];
  if (!songTags || songTags.length === 0) return;
  _copiedTags = [...songTags];
  const btn = document.getElementById('copy-tags-btn');
  if (btn) {
    btn.textContent = 'Copied!';
    btn.style.color = '#f59e0b';
    setTimeout(() => { btn.textContent = 'Your Tags'; btn.style.color = ''; }, 1200);
  }
}

function pasteTagsToSelected() {
  if (!selectedTrackId || !_copiedTags || _copiedTags.length === 0) return;
  if (!tags[selectedTrackId]) tags[selectedTrackId] = [];
  let added = 0;
  _copiedTags.forEach(gid => {
    if (!tags[selectedTrackId].includes(gid)) { tags[selectedTrackId].push(gid); added++; }
  });
  if (added > 0) { saveData(); renderCurrentTags(); renderGenreTree(); renderSongList(); updateStats(); }
}

// ── KEYBOARD NAV ──
document.addEventListener('click', e => {
  const dd = document.getElementById('incomplete-dropdown');
  const toggle = document.getElementById('incomplete-toggle');
  if (dd && !dd.contains(e.target) && e.target !== toggle) dd.style.display = 'none';
});

document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'v') { e.preventDefault(); pasteTagsToSelected(); return; }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const visible = getVisibleTracks();
  if (!visible.length) return;
  const idx = visible.findIndex(t => t.id === selectedTrackId);
  const next = e.key === 'ArrowDown'
    ? visible[Math.min(idx + 1, visible.length - 1)]
    : visible[Math.max(idx - 1, 0)];
  if (next && next.id !== selectedTrackId) {
    selectTrack(next.id);
    const nextIdx = visible.indexOf(next);
    const list = document.getElementById('song-list');
    const rowTop = nextIdx * ROW_H;
    const rowBot = rowTop + ROW_H;
    if (rowTop < list.scrollTop) list.scrollTop = rowTop;
    else if (rowBot > list.scrollTop + list.clientHeight) list.scrollTop = rowBot - list.clientHeight;
  }
});

// ── FILTER SECTION DRAG AND DROP ──
function initFilterDragDrop() {
  const container = document.getElementById('filter-sections');
  let dragSrc = null;

  // Restore saved order
  const saved = localStorage.getItem('objectsort_filter_order');
  if (saved) {
    try {
      JSON.parse(saved).forEach(name => {
        const el = container.querySelector(`[data-section="${name}"]`);
        if (el) container.appendChild(el);
      });
    } catch(e) {}
  }

  container.querySelectorAll('.filter-section').forEach(sec => {
    sec.addEventListener('dragstart', e => {
      dragSrc = sec;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => sec.style.opacity = '0.4', 0);
    });
    sec.addEventListener('dragend', () => {
      sec.style.opacity = '';
      container.querySelectorAll('.filter-section').forEach(s => s.classList.remove('drag-over'));
      const order = [...container.querySelectorAll('.filter-section')].map(s => s.dataset.section);
      localStorage.setItem('objectsort_filter_order', JSON.stringify(order));
    });
    sec.addEventListener('dragover', e => {
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      container.querySelectorAll('.filter-section').forEach(s => s.classList.remove('drag-over'));
      if (sec !== dragSrc) sec.classList.add('drag-over');
    });
    sec.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrc && dragSrc !== sec) {
        const els = [...container.querySelectorAll('.filter-section')];
        const fromIdx = els.indexOf(dragSrc), toIdx = els.indexOf(sec);
        if (fromIdx < toIdx) sec.after(dragSrc); else sec.before(dragSrc);
      }
    });
  });
}

// ── INIT ──
function initResizeHandles() {
  const sidebar = document.querySelector('.sidebar');
  const rightPanel = document.querySelector('.right-panel');

  function setupHandle(handle, getEl, sign) {
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      let lastX = e.clientX;
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const onMove = e => {
        const dx = (e.clientX - lastX) * sign;
        lastX = e.clientX;
        const el = getEl();
        el.style.width = Math.min(Math.max(el.offsetWidth + dx, 140), 600) + 'px';
      };
      const onUp = () => {
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  setupHandle(document.getElementById('handle-left'), () => sidebar, 1);
  setupHandle(document.getElementById('handle-right'), () => rightPanel, -1);
}

function checkBackupReminder() {
  const count = parseInt(localStorage.getItem('objectsort_session_count') || '0') + 1;
  localStorage.setItem('objectsort_session_count', String(count));
  const lastDismissed = parseInt(localStorage.getItem('objectsort_backup_dismissed') || '0');
  const daysSince = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
  if (count % 5 === 0 || daysSince > 7) {
    document.getElementById('backup-banner').style.display = 'flex';
  }
}

function dismissBackupBanner() {
  localStorage.setItem('objectsort_backup_dismissed', String(Date.now()));
  document.getElementById('backup-banner').style.display = 'none';
}

async function init() {
  const uriEl = document.getElementById('redirect-uri-display');
  if (uriEl) uriEl.textContent = location.origin + location.pathname;
  loadData();
  if (await checkAuth()) {
    document.getElementById('setup').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initResizeHandles();
    initFilterDragDrop();
    renderGenreTree(); renderParentSelect(); await loadTracks();
    checkBackupReminder();
  }
}

init();
