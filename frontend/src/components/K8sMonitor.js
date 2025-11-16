import React, { useState, useEffect } from 'react';
import './K8sMonitor.css';

function K8sMonitor({ darkMode }) {
  const [pods, setPods] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [pvcs, setPvcs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchK8sResources();
    const interval = setInterval(fetchK8sResources, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchK8sResources = async () => {
    try {
      const response = await fetch('/api/k8s/resources');
      const data = await response.json();
      setPods(data.pods || []);
      setNodes(data.nodes || []);
      setPvcs(data.pvcs || []);
    } catch (error) {
      console.error('Failed to fetch K8s resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="k8s-monitor loading">로딩 중...</div>;
  }

  return (
    <div className={`k8s-monitor ${darkMode ? 'dark' : ''}`}>
      <h2>Kubernetes 리소스 모니터</h2>

      <section className="resource-section">
        <h3>Nodes ({nodes.length})</h3>
        <div className="resource-grid">
          {nodes.map((node, idx) => (
            <div key={idx} className="resource-card node-card">
              <div className="card-header">
                <span className="name">{node.name}</span>
                <span className={`status ${node.ready ? 'ready' : 'not-ready'}`}>
                  {node.ready ? 'Ready' : 'NotReady'}
                </span>
              </div>
              <div className="card-body">
                <div className="metric">
                  <span>CPU:</span>
                  <span>{node.cpu}</span>
                </div>
                <div className="metric">
                  <span>Memory:</span>
                  <span>{node.memory}</span>
                </div>
                <div className="metric">
                  <span>Pods:</span>
                  <span>{node.pods}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="resource-section">
        <h3>Pods ({pods.length})</h3>
        <div className="resource-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Namespace</th>
                <th>Status</th>
                <th>Restarts</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {pods.map((pod, idx) => (
                <tr key={idx}>
                  <td>{pod.name}</td>
                  <td>{pod.namespace}</td>
                  <td>
                    <span className={`status-badge ${pod.status.toLowerCase()}`}>
                      {pod.status}
                    </span>
                  </td>
                  <td>{pod.restarts}</td>
                  <td>{pod.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="resource-section">
        <h3>PersistentVolumeClaims ({pvcs.length})</h3>
        <div className="resource-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Namespace</th>
                <th>Status</th>
                <th>Capacity</th>
                <th>StorageClass</th>
              </tr>
            </thead>
            <tbody>
              {pvcs.map((pvc, idx) => (
                <tr key={idx}>
                  <td>{pvc.name}</td>
                  <td>{pvc.namespace}</td>
                  <td>
                    <span className={`status-badge ${pvc.status.toLowerCase()}`}>
                      {pvc.status}
                    </span>
                  </td>
                  <td>{pvc.capacity}</td>
                  <td>{pvc.storageClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default K8sMonitor;
