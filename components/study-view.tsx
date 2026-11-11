const studyPage = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mufasa Files | Premium Edition</title>
<script src="https://unpkg.com/lucide@latest"></script>
<style>
:root {
  --primary: #6366f1;
  --primary-hover: #818cf8;
  --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.1);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent: #00d2ff;
  --roblox-red: #ef4444;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  background: var(--bg-gradient) fixed;
  color: var(--text-main);
  min-height: 100vh;
  display: flex;
  overflow-x: hidden;
}

.sidebar {
  position: fixed;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 70px;
  max-height: 85vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden auto;
}

.sidebar::-webkit-scrollbar { width: 4px; }

.sidebar-btn {
  width: 50px;
  height: 50px;
  min-height: 50px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  font-weight: 700;
  font-size: 14px;
  position: relative;
  flex-shrink: 0;
  text-decoration: none;
}

.sidebar-btn:hover {
  background: var(--primary);
  border-color: var(--primary-hover);
  transform: translateX(5px) scale(1.1);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
}

.sidebar-btn.roblox-special {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  margin-top: 10px;
  border-top: 2px solid rgba(239, 68, 68, 0.5);
}

.sidebar-btn.roblox-special:hover {
  background: var(--roblox-red);
  border-color: #ff7171;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.sidebar-btn::after {
  content: attr(data-letter);
  position: absolute;
  left: 65px;
  background: var(--primary);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  z-index: 1001;
}

.sidebar-btn.roblox-special::after { background: var(--roblox-red); }
.sidebar-btn:hover::after { opacity: 1; transform: translateX(5px); }
.sidebar-btn.empty { opacity: 0.2; cursor: not-allowed; }

.main-content {
  margin-left: 100px;
  flex: 1;
  min-width: 0;
  padding: 40px 20px;
  max-width: 1200px;
  margin-right: auto;
}

header { text-align: center; margin-bottom: 50px; }
h1 {
  font-size: 3.5rem;
  background: linear-gradient(to right, #fff, var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
  letter-spacing: -1px;
}
.sub-header { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 20px; }

.search-container { max-width: 500px; margin: 0 auto 40px; }
#searchInput {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  color: white;
  font-size: 16px;
  outline: none;
}
#searchInput:focus {
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.letter-section {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 30px;
  animation: fadeInUp 0.6s ease forwards;
}
.letter-header {
  font-size: 24px;
  color: var(--accent);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.buttons-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 15px; }
input[type="button"] {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  padding: 18px 20px;
  font-size: 15px;
  color: var(--text-main);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  width: 100%;
}
input[type="button"]:hover {
  background: var(--primary);
  border-color: var(--primary-hover);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

#lolbutton {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 600;
}
#lolbutton:hover { background: #f87171; transform: scale(1.05); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

@media (max-width: 768px) {
  .sidebar {
    bottom: 20px;
    top: auto;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: row;
    width: 90%;
    height: 70px;
    overflow: auto hidden;
  }
  .main-content { margin-left: 0; margin-bottom: 100px; padding: 20px; }
  h1 { font-size: 2.2rem; }
  .sidebar-btn::after { display: none; }
  .sidebar-btn.roblox-special {
    margin-top: 0;
    margin-left: 10px;
    border-top: none;
    border-left: 2px solid rgba(239, 68, 68, 0.5);
  }
}
</style>
</head>
<body>
<nav class="sidebar" id="sidebar" aria-label="Resource categories"></nav>
<main class="main-content">
  <header>
    <h1>MUFASA FILES</h1>
    <p class="sub-header">Made for educational and entertainment purposes only,
    I am not responsible for the use of these game and am not the owner.</p>
    <p style="color: var(--accent); opacity: 0.8;">Ty to UGS files | Youtube: Mufasa-772</p>
    <div class="search-container">
      <input type="text" placeholder="Search resources..." aria-label="Search resources" id="searchInput">
    </div>
    <button id="lolbutton" type="button">Force Load Resources</button>
    <p id="resource-status" role="status"></p>
  </header>
  <div id="sections-container"></div>
  <footer style="text-align: center; margin-top: 50px; color: var(--text-muted); font-size: 0.9rem;">
    <p>Woops! Seems like there is no game titled that, try again or check spelling, there cant be space</p>
  </footer>
</main>
<script src="https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/searchbut.js"></script>
<script>
  const sidebar = document.getElementById('sidebar');
  const sections = document.getElementById('sections-container');
  const resourceStatus = document.getElementById('resource-status');
  const loadButton = document.getElementById('lolbutton');
  let catalogScript;

  function loadResources(src) {
    if (sections.childElementCount) return;
    catalogScript?.remove();
    loadButton.disabled = true;
    resourceStatus.textContent = 'Loading resources…';
    catalogScript = document.createElement('script');
    catalogScript.src = src;
    catalogScript.onload = () => {
      loadButton.disabled = false;
      resourceStatus.textContent = sections.childElementCount ? '' : 'Resources could not load. Try again.';
    };
    catalogScript.onerror = () => {
      loadButton.disabled = false;
      resourceStatus.textContent = 'Resources could not load. Try again.';
    };
    document.body.appendChild(catalogScript);
  }

  function formatResources() {
    sections.querySelectorAll('.buttons-container').forEach(grid => grid.classList.add('buttons-grid'));
    sections.querySelectorAll('input[type="button"]').forEach(button => {
      if (button.dataset.resourceReady) return;
      button.dataset.resourceReady = 'true';
      const filename = button.value;
      if (/^cl/i.test(filename)) button.value = filename.slice(2).trimStart();
      // A sandboxed Study page cannot write into the catalog's blank popup.
      // Navigate the popup to a Blob containing the downloaded resource instead.
      button.onclick = async () => {
        const popup = window.open('about:blank', '_blank');
        if (!popup) {
          resourceStatus.textContent = 'Allow pop-ups to open this resource.';
          return;
        }
        resourceStatus.textContent = '';
        try {
          const path = filename.lastIndexOf('.') > 0 ? filename : filename + '.html';
          const url = 'https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/' + encodeURIComponent(path);
          const response = await fetch(url);
          if (!response.ok) throw new Error('Resource unavailable');
          const objectUrl = URL.createObjectURL(new Blob([await response.text()], { type: 'text/html' }));
          popup.location.replace(objectUrl);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        } catch {
          popup.close();
          resourceStatus.textContent = 'This resource could not open. Try again.';
        }
      };
    });
    const existingLink = document.getElementById('roblox-link');
    if (existingLink) {
      if (sidebar.lastElementChild !== existingLink) sidebar.appendChild(existingLink);
      return;
    }
    const link = document.createElement('a');
    link.id = 'roblox-link';
    link.href = 'https://mizumath.com/study/roblox.html';
    link.className = 'sidebar-btn roblox-special';
    link.setAttribute('data-letter', 'Roblox');
    link.setAttribute('aria-label', 'Roblox');
    link.innerHTML = window.lucide ? '<i data-lucide="gamepad-2"></i>' : 'R';
    sidebar.appendChild(link);
    window.lucide?.createIcons();
  }

  new MutationObserver(formatResources).observe(sections, { childList: true, subtree: true });
  loadButton.addEventListener('click', () => {
    loadResources('https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@latest/game.js');
  });
  formatResources();
  loadResources('https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile@main/games.js');
</script>
</body>
</html>`;

export function StudyView() {
  return (
    <iframe
      title="Study"
      srcDoc={studyPage}
      sandbox="allow-scripts allow-popups"
      referrerPolicy="no-referrer"
      style={{ display: 'block', width: '100%', height: 'calc(100dvh - 140px)', minHeight: 320, border: 0, borderRadius: 16 }}
    />
  );
}
