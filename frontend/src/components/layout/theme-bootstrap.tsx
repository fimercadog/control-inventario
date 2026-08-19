/** Applies the last visual preference before hydration to avoid a light-theme flash. */
export function ThemeBootstrap() {
  const script = `(()=>{try{const t=localStorage.getItem('fidelos-theme');const v=t==='light'||t==='dark'||t==='system'?t:'system';const d=v==='dark'||(v==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=v}catch{}})()`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
