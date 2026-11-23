import placement from '../search-sponsor.json';

export function SearchSponsor() {
  const {name, url} = placement;
  if (!name.trim() || !URL.canParse(url) || new URL(url).protocol !== 'https:') return null;
  return <aside className="searchSponsor" aria-label="Advertisement">
    <small>Sponsored</small>
    <a href={url} target="_blank" rel="sponsored noopener noreferrer">{name} ↗</a>
  </aside>;
}
