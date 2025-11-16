import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Login from './pages/Login';
import FileManager from './pages/FileManager';
import K8sMonitor from './components/K8sMonitor';
import './App.css';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [currentTab, setCurrentTab] = useState('files');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    setUsername('');
  };

  if (!username) {
    return <Login onLogin={setUsername} />;
  }

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h1>☁️ {!sidebarCollapsed && 'Cloud Storage'}</h1>
            {!sidebarCollapsed && <div className="user-info">{username}</div>}
          </div>
          <nav className="sidebar-nav">
            <button 
              className={`nav-button ${currentTab === 'files' ? 'active' : ''}`}
              onClick={() => setCurrentTab('files')}
              title="파일 관리"
            >
              <span className="nav-icon">📁</span>
              {!sidebarCollapsed && <span className="nav-label">파일 관리</span>}
            </button>
            <button 
              className={`nav-button ${currentTab === 'monitor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('monitor')}
              title="K8s 모니터"
            >
              <span className="nav-icon">📊</span>
              {!sidebarCollapsed && <span className="nav-label">K8s 모니터</span>}
            </button>
          </nav>
          
          <div className="sidebar-footer">
            <button 
              className="nav-button"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? '라이트 모드' : '다크 모드'}
            >
              <span className="nav-icon">{darkMode ? '☀️' : '🌙'}</span>
              {!sidebarCollapsed && <span className="nav-label">{darkMode ? '라이트 모드' : '다크 모드'}</span>}
            </button>
            <button 
              className="nav-button"
              onClick={handleLogout}
              title="로그아웃"
            >
              <span className="nav-icon">🚪</span>
              {!sidebarCollapsed && <span className="nav-label">로그아웃</span>}
            </button>
            <button 
              className="nav-button toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? '펼치기' : '접기'}
            >
              <span className="nav-icon">{sidebarCollapsed ? '▶' : '◀'}</span>
              {!sidebarCollapsed && <span className="nav-label">접기</span>}
            </button>
          </div>
        </aside>
        
        <main className={`app-main ${sidebarCollapsed ? 'expanded' : ''}`}>
          {currentTab === 'files' && <FileManager darkMode={darkMode} username={username} />}
          {currentTab === 'monitor' && <K8sMonitor darkMode={darkMode} />}
        </main>
      </div>
    </Router>
  );
}

export default App;
