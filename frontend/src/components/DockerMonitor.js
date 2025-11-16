import React, { useState, useEffect } from 'react';
import './DockerMonitor.css';

const DockerMonitor = ({ darkMode }) => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadContainers();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadContainers();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadContainers = async () => {
    try {
      const response = await fetch('/api/docker/containers');
      const data = await response.json();
      setContainers(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load containers:', error);
      setLoading(false);
    }
  };

  const loadContainerStats = async (containerId) => {
    try {
      const response = await fetch(`/api/docker/stats?id=${containerId}`);
      const data = await response.json();
      setStats(prev => ({ ...prev, [containerId]: data }));
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleStart = async (containerId) => {
    try {
      await fetch(`/api/docker/start?id=${containerId}`, { method: 'POST' });
      setTimeout(loadContainers, 1000);
    } catch (error) {
      console.error('Failed to start container:', error);
    }
  };

  const handleStop = async (containerId) => {
    try {
      await fetch(`/api/docker/stop?id=${containerId}`, { method: 'POST' });
      setTimeout(loadContainers, 1000);
    } catch (error) {
      console.error('Failed to stop container:', error);
    }
  };

  const handleRestart = async (containerId) => {
    try {
      await fetch(`/api/docker/restart?id=${containerId}`, { method: 'POST' });
      setTimeout(loadContainers, 2000);
    } catch (error) {
      console.error('Failed to restart container:', error);
    }
  };

  const handleShowLogs = async (container) => {
    setSelectedContainer(container);
    setShowLogs(true);
    try {
      const response = await fetch(`/api/docker/logs?id=${container.id}&lines=500`);
      const data = await response.json();
      setLogs(data.logs || 'No logs available');
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs('Failed to load logs');
    }
  };

  const getStateColor = (state) => {
    switch (state.toLowerCase()) {
      case 'running':
        return '#4CAF50';
      case 'exited':
        return '#f44336';
      case 'paused':
        return '#FF9800';
      case 'restarting':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="docker-monitor">
        <div className="loading">컨테이너 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="docker-monitor">
      <div className="docker-header">
        <h2>🐳 Docker 컨테이너 모니터</h2>
        <div className="docker-controls">
          <button
            className={`btn ${autoRefresh ? 'btn-active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 자동새로고침 ON' : '⭕ 자동새로고침 OFF'}
          </button>
          <button className="btn" onClick={loadContainers}>
            🔄 새로고침
          </button>
          <span className="container-count">
            총 {containers.length}개 컨테이너
            {' · '}
            실행중 {containers.filter(c => c.state === 'running').length}개
          </span>
        </div>
      </div>

      <div className="containers-grid">
        {containers.map((container) => (
          <div key={container.id} className="container-card">
            <div className="container-card-header">
              <div className="container-info">
                <div 
                  className="container-state"
                  style={{ backgroundColor: getStateColor(container.state) }}
                >
                  {container.state}
                </div>
                <h3 className="container-name">{container.name}</h3>
                <span className="container-id">{container.id}</span>
              </div>
            </div>

            <div className="container-details">
              <div className="detail-row">
                <span className="detail-label">이미지:</span>
                <span className="detail-value">{container.image}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">상태:</span>
                <span className="detail-value">{container.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">생성일:</span>
                <span className="detail-value">{formatDate(container.created)}</span>
              </div>
              {container.ports && container.ports.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">포트:</span>
                  <span className="detail-value">{container.ports.join(', ')}</span>
                </div>
              )}
            </div>

            {stats[container.id] && (
              <div className="container-stats">
                <div className="stat-item">
                  <span className="stat-label">CPU</span>
                  <span className="stat-value">
                    {stats[container.id].cpuPercentage?.toFixed(2) || 0}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">메모리</span>
                  <span className="stat-value">
                    {formatBytes(stats[container.id].memoryUsage)} / {formatBytes(stats[container.id].memoryLimit)}
                    <br />
                    <small>({stats[container.id].memoryPercentage?.toFixed(1) || 0}%)</small>
                  </span>
                </div>
              </div>
            )}

            <div className="container-actions">
              {container.state === 'running' ? (
                <>
                  <button 
                    className="btn btn-warning"
                    onClick={() => handleStop(container.id)}
                    title="정지"
                  >
                    ⏸️ 정지
                  </button>
                  <button 
                    className="btn btn-info"
                    onClick={() => handleRestart(container.id)}
                    title="재시작"
                  >
                    🔄 재시작
                  </button>
                  <button 
                    className="btn btn-info"
                    onClick={() => loadContainerStats(container.id)}
                    title="통계"
                  >
                    📊 통계
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-success"
                  onClick={() => handleStart(container.id)}
                  title="시작"
                >
                  ▶️ 시작
                </button>
              )}
              <button 
                className="btn"
                onClick={() => handleShowLogs(container)}
                title="로그 보기"
              >
                📄 로그
              </button>
            </div>
          </div>
        ))}
      </div>

      {containers.length === 0 && (
        <div className="no-containers">
          <p>실행 중인 컨테이너가 없습니다.</p>
        </div>
      )}

      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="logs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logs-header">
              <h3>📄 {selectedContainer?.name} 로그</h3>
              <button 
                className="logs-close"
                onClick={() => setShowLogs(false)}
              >
                ✕
              </button>
            </div>
            <div className="logs-content">
              <pre>{logs}</pre>
            </div>
            <div className="logs-footer">
              <button 
                className="btn"
                onClick={() => handleShowLogs(selectedContainer)}
              >
                🔄 새로고침
              </button>
              <button 
                className="btn"
                onClick={() => {
                  navigator.clipboard.writeText(logs);
                  alert('로그가 클립보드에 복사되었습니다.');
                }}
              >
                📋 복사
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockerMonitor;
