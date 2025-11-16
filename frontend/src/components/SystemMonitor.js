import React, { useState, useEffect } from 'react';
import { fetchSystemStats } from '../utils/api';
import { formatFileSize } from '../utils/helpers';
import './SystemMonitor.css';

const SystemMonitor = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchSystemStats();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="system-monitor loading">시스템 정보 로딩 중...</div>;
  }

  if (!stats) {
    return <div className="system-monitor error">시스템 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="system-monitor">
      <h2>📊 시스템 모니터</h2>
      
      <div className="stats-grid">
        {/* CPU */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">⚡</span>
            <span className="stat-title">CPU</span>
          </div>
          <div className="stat-content">
            <div className="progress-bar">
              <div 
                className="progress-fill cpu"
                style={{ width: `${stats.cpu.usagePercent.toFixed(1)}%` }}
              />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.cpu.usagePercent.toFixed(1)}%</span>
              <span className="stat-info">{stats.cpu.cores} 코어</span>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">🧠</span>
            <span className="stat-title">메모리</span>
          </div>
          <div className="stat-content">
            <div className="progress-bar">
              <div 
                className="progress-fill memory"
                style={{ width: `${stats.memory.usedPercent.toFixed(1)}%` }}
              />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.memory.usedPercent.toFixed(1)}%</span>
              <span className="stat-info">
                {formatFileSize(stats.memory.used)} / {formatFileSize(stats.memory.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Disk */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">💾</span>
            <span className="stat-title">디스크</span>
          </div>
          <div className="stat-content">
            <div className="progress-bar">
              <div 
                className="progress-fill disk"
                style={{ width: `${stats.disk.usedPercent.toFixed(1)}%` }}
              />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.disk.usedPercent.toFixed(1)}%</span>
              <span className="stat-info">
                {formatFileSize(stats.disk.used)} / {formatFileSize(stats.disk.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
