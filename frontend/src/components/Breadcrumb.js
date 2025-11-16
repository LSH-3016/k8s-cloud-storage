import React from 'react';
import './Breadcrumb.css';

const Breadcrumb = ({ currentPath, onNavigate }) => {
  const parts = currentPath.split('/').filter(p => p);
  
  const paths = [
    { name: '홈', path: '/' },
    ...parts.map((part, index) => ({
      name: part,
      path: '/' + parts.slice(0, index + 1).join('/')
    }))
  ];

  return (
    <div className="breadcrumb">
      {paths.map((item, index) => (
        <React.Fragment key={item.path}>
          <button
            className="breadcrumb-item"
            onClick={() => onNavigate(item.path)}
          >
            {item.name}
          </button>
          {index < paths.length - 1 && (
            <span className="breadcrumb-separator">›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
