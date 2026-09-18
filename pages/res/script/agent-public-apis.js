const JSON_HEADERS = { Accept: 'application/json' };

async function getJson(url) {
  const response = await fetch(url, { headers: JSON_HEADERS });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

function text(value) {
  return String(value || '').trim();
}

function encode(value) {
  return encodeURIComponent(text(value));
}

export async function weather(args) {
  const place = text(args.join(' '));
  if (!place) return 'Uso: weather <città> [giorni 1-16]';
  const days = Math.min(16, Math.max(1, Number(args.at(-1)) || 3));
  const query = args.length > 1 && /^\d+$/.test(args.at(-1)) ? args.slice(0, -1).join(' ') : place;
  const locations = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encode(query)}&count=1&language=it&format=json`);
  const location = locations.results?.[0];
  if (!location) return `Località non trovata: ${query}`;
  const forecast = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=${days}&timezone=auto`);
  const current = forecast.current;
  const daily = forecast.daily?.time?.map((date, index) => `${date}: ${forecast.daily.temperature_2m_min[index]}–${forecast.daily.temperature_2m_max[index]} °C, pioggia ${forecast.daily.precipitation_probability_max[index] ?? 'n/d'}%`).join('\n');
  return `Meteo per ${location.name}, ${location.country || ''}\nOra: ${current?.temperature_2m ?? 'n/d'} °C, percepita ${current?.apparent_temperature ?? 'n/d'} °C, umidità ${current?.relative_humidity_2m ?? 'n/d'}%, vento ${current?.wind_speed_10m ?? 'n/d'} km/h\nPrevisione:\n${daily || 'non disponibile'}\nFonte: Open-Meteo (open-meteo.com)`;
}

export async function country(args) {
  const name = text(args.join(' '));
  if (!name) return 'Uso: country <nome o codice ISO>'; 
  const fields = 'name,capital,cca2,cca3,region,subregion,population,languages,currencies,flags';
  let data;
  try {
    data = await getJson(`https://restcountries.com/v3.1/name/${encode(name)}?fields=${fields}`);
  } catch (_) {
    data = await getJson(`https://restcountries.com/v3.1/alpha/${encode(name)}?fields=${fields}`);
  }
  const item = Array.isArray(data) ? data[0] : data;
  if (!item) return `Paese non trovato: ${name}`;
  const languages = Object.values(item.languages || {}).join(', ') || 'n/d';
  const currencies = Object.entries(item.currencies || {}).map(([code, value]) => `${value.name} (${code})`).join(', ') || 'n/d';
  return `Paese: ${item.name?.common || name} (${item.cca2 || 'n/d'})\nCapitale: ${item.capital?.join(', ') || 'n/d'}\nRegione: ${item.region || 'n/d'}${item.subregion ? ` / ${item.subregion}` : ''}\nPopolazione: ${item.population?.toLocaleString('it-IT') || 'n/d'}\nLingue: ${languages}\nValute: ${currencies}\nFonte: REST Countries (restcountries.com)`;
}

export async function wikimedia(args) {
  const query = text(args.join(' '));
  if (!query) return 'Uso: wiki <argomento>'; 
  const url = `https://it.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encode(query)}&gsrlimit=5&prop=info|extracts&exintro=1&explaintext=1&inprop=url&format=json&origin=*`;
  const data = await getJson(url);
  const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  if (!pages.length) return `Nessun risultato Wikimedia per: ${query}`;
  return `Risultati Wikimedia per “${query}”:\n${pages.map((page, index) => `${index + 1}. ${page.title}\n${(page.extract || 'Estratto non disponibile').slice(0, 700)}\n${page.fullurl || `https://it.wikipedia.org/?curid=${page.pageid}`}`).join('\n\n')}\nFonte: Wikimedia/Wikipedia`;
}

export function getPublicApiHelp() {
  return 'API pubbliche: weather <città> [giorni], country <paese|ISO>, wiki <argomento>.';
}
