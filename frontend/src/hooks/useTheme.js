import { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('stellarpath-theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('stellarpath-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, setDark };
}
