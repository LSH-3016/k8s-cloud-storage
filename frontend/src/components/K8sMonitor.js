import React, { useState, useEffect } from 'react';
import './K8sMonitor.css';

function K8sMonitor({ darkMode }) {
  const [pods, setPods] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [pvcs, setPvcs] = useState([]);
  const [services, setServices] = useState([]);
  const [storageClasses, setStorageClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 접기/펼치기 상태
  const [collapsed, setCollapsed] = useState({
    nodes: false,
    pods: false,
    pvcs: false,
    services: false,
    storageClasses: false,
  });

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
      setServices(data.services || []);
      setStorageClasses(data.storageClasses || []);
    } catch (error) {
      console.error('Failed to fetch K8s resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return <div className="k8s-monitor loading">로딩 중...</div>;
  }

  return (
    <div className={`k8s-monitor ${darkMode ? 'dark' : ''}`}>
      <h2>Kubernetes 리소스 모니터</h2>

      <section className="resource-section">
        <div className="section-header" onClick={() => toggleSection('nodes')}>
          <h3>Nodes ({nodes.length})</h3>
          <button className="toggle-btn">{collapsed.nodes ? '▼' : '▲'}</button>
        </div>
        {!collapsed.nodes && (
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
        )}
      </section>

      <section className="resource-section">
        <div className="section-header" onClick={() => toggleSection('pods')}>
          <h3>Pods ({pods.length})</h3>
          <button className="toggle-btn">{collapsed.pods ? '▼' : '▲'}</button>
        </div>
        {!collapsed.pods && (
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
        )}
      </section>

      <section className="resource-section">
        <div className="section-header" onClick={() => toggleSection('services')}>
          <h3>Services ({services.length})</h3>
          <button className="toggle-btn">{collapsed.services ? '▼' : '▲'}</button>
        </div>
        {!collapsed.services && (
          <div className="resource-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Namespace</th>
                  <th>Type</th>
                  <th>Cluster IP</th>
                  <th>Ports</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, idx) => (
                  <tr key={idx}>
                    <td>{svc.name}</td>
                    <td>{svc.namespace}</td>
                    <td>
                      <span className="service-type">{svc.type}</span>
                    </td>
                    <td>{svc.clusterIP}</td>
                    <td>{svc.ports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="resource-section">
        <div className="section-header" onClick={() => toggleSection('pvcs')}>
          <h3>PersistentVolumeClaims ({pvcs.length})</h3>
          <button className="toggle-btn">{collapsed.pvcs ? '▼' : '▲'}</button>
        </div>
        {!collapsed.pvcs && (
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
        )}
      </section>

      <section className="resource-section">
        <div className="section-header" onClick={() => toggleSection('storageClasses')}>
          <h3>StorageClasses ({storageClasses.length})</h3>
          <button className="toggle-btn">{collapsed.storageClasses ? '▼' : '▲'}</button>
        </div>
        {!collapsed.storageClasses && (
          <div className="resource-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Provisioner</th>
                  <th>Reclaim Policy</th>
                  <th>Volume Binding Mode</th>
                </tr>
              </thead>
              <tbody>
                {storageClasses.map((sc, idx) => (
                  <tr key={idx}>
                    <td>{sc.name}</td>
                    <td>{sc.provisioner}</td>
                    <td>{sc.reclaimPolicy}</td>
                    <td>{sc.volumeBindingMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default K8sMonitor;
