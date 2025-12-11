export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('check-ip-theme') || 'system';
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const resolvedTheme = theme === 'system' ? systemTheme : theme;
              const root = document.documentElement;
              
              // Remove all theme classes
              root.classList.remove('light', 'dark');
              
              // Add the resolved theme class
              if (resolvedTheme === 'dark') {
                root.classList.add('dark');
              } else {
                root.classList.add('light');
                root.classList.remove('dark');
              }
              
              root.setAttribute('data-theme', resolvedTheme);
            } catch (e) {
              console.error('Error setting theme:', e);
            }
          })();
        `,
      }}
    />
  );
}

