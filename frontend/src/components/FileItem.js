import React, { useState } from 'react';
import { getFileIcon, formatFileSize, isImageFile, isVideoFile } from '../utils/helpers';
import { getThumbnailUrl } from '../utils/api';
import './FileItem.css';

const FileItem = ({ 
  file, 
  selected, 
  onSelect, 
  onDoubleClick, 
  onContextMenu,
  viewMode,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  darkMode,
  username
}) => {
  const showThumbnail = isImageFile(file.name) || isVideoFile(file.name);
  const icon = getFileIcon(file.name, file.isDir);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <div
      className={`file-item ${viewMode} ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="file-icon">
        {showThumbnail && !file.isDir ? (
          <>
            {!thumbnailLoaded && !thumbnailError && (
              <div className="thumbnail-loading">
                <span className="loading-spinner"></span>
              </div>
            )}
            <img
              src={getThumbnailUrl(username, file.path)}
              alt={file.name}
              className="file-thumbnail"
              style={{ display: thumbnailLoaded && !thumbnailError ? 'block' : 'none' }}
              onLoad={() => setThumbnailLoaded(true)}
              onError={() => {
                setThumbnailError(true);
                setThumbnailLoaded(false);
              }}
            />
            {thumbnailError && (
              <span className="file-emoji">
                {icon}
              </span>
            )}
          </>
        ) : (
          <span className="file-emoji">
            {icon}
          </span>
        )}
      </div>
      
      <div className="file-info">
        <div className="file-name" title={file.name}>
          {file.name}
        </div>
        {viewMode === 'list' && (
          <div className="file-details">
            <span className="file-size">
              {file.isDir ? '폴더' : formatFileSize(file.size)}
            </span>
            <span className="file-date">{file.modTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileItem;