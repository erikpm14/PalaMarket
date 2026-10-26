const parseRoute = () => {
  const hash = location.hash.slice(1) || '/';
  const [path, query = ''] = hash.split('?');
  return { path, query: new URLSearchParams(query) };
};

export const router = {
  current: parseRoute,
  navigate(path) { location.hash = path; },
  start(callback) { window.addEventListener('hashchange', callback); callback(); },
};
