/** Applies the last visual preference before hydration to avoid a light-theme flash. */
export function ThemeBootstrap() {
  const script = `(()=>{try{const t=localStorage.getItem('fidelos-theme')||'system';const d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch{}})()`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
