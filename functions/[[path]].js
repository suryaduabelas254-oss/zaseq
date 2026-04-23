export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts.length === 0) return next();

  let lang = 'en-US';
  let type = 'movie';
  let id = null;

  // ✅ SAFE URL PARSING
  if (parts.length === 1 && /^\d+$/.test(parts[0])) {
    id = parts[0];
  }
  else if (parts.length === 2 && /^[a-z]{2}$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
    lang = `${parts[0]}-${parts[0].toUpperCase()}`;
    id = parts[1];
  }
  else if (parts.length === 2 && parts[0] === 'tv' && /^\d+$/.test(parts[1])) {
    type = 'tv';
    id = parts[1];
  }
  else if (
    parts.length === 3 &&
    /^[a-z]{2}$/.test(parts[0]) &&
    parts[1] === 'tv' &&
    /^\d+$/.test(parts[2])
  ) {
    lang = `${parts[0]}-${parts[0].toUpperCase()}`;
    type = 'tv';
    id = parts[2];
  }
  else {
    return next(); // ⬅️ IMPORTANT (no crash)
  }

  const TMDB_API_KEY = '3ed72f657ce5c5779383b2191d6d0111';
  const SITE_NAME = 'PrimediaHD';

  let title = `Watch ${type === 'tv' ? 'TV Show' : 'Movie'} - ${SITE_NAME}`;
  let description = `Watch online in HD quality on ${SITE_NAME}`;
  let image = `${url.origin}/default-og.jpg`;

  try {
    const tmdbUrl =
      `https://api.themoviedb.org/3/${type}/${id}` +
      `?api_key=${TMDB_API_KEY}&language=${lang}`;

    const res = await fetch(tmdbUrl);
    if (res.ok) {
      const data = await res.json();
      const name = data.title || data.name;
      const year =
        data.release_date?.slice(0, 4) ||
        data.first_air_date?.slice(0, 4) ||
        '';

      title = `${name}${year ? ` (${year})` : ''} - ${SITE_NAME}`;
      description = data.overview || description;

      if (data.backdrop_path) {
        image = `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
      } else if (data.poster_path) {
        image = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
      }
    }
  } catch (e) {
    // fail silently (OG fallback)
  }

  const redirectHash =
    type === 'tv'
      ? `tv=${id}&lang=${lang}`
      : `movie=${id}&lang=${lang}`;

  const html = `<!DOCTYPE html>
<html lang="${lang.split('-')[0]}">
<head>
<meta charset="UTF-8">
<title>${title}</title>

<meta property="og:type" content="video.${type}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url.href}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
</head>
<body>
<script>
location.replace("/index.html#${redirectHash}");
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}
