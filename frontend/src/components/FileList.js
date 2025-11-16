import React, { useState, useRef, useEffect } from 'react';
import FileItem from './FileItem';
import FileContextMenu from './FileContextMenu';
import './FileList.css';

const FileList = ({ 
  files, 
  loading, 
  selectedFiles, 
  onFileSelect, 
  onDoubleClick,
  onRefresh,
  onCopy,
  onCut,
  onPaste,
  hasClipboard,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedFile,
  dragOverFolder,
  darkMode
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const containerRef = useRef(null);

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file: file
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 빈 공간 클릭 시 선택 해제
  const handleContainerClick = (e) => {
    // 드래그 중이 아니고, 파일 아이템이 아닌 빈 공간을 클릭했을 때 선택 해제
    if (!isDragging && 
        (e.target === containerRef.current || 
         e.target.classList.contains('file-list') ||
         e.target.classList.contains('file-list-container'))) {
      onFileSelect(null, false);
    }
  };

  // 드래그 선택 시작
  const handleMouseDown = (e) => {
    // 우클릭은 무시
    if (e.button !== 0) return;
    
    // 파일 아이템이 아닌 빈 공간을 클릭했을 때만 드래그 선택 시작
    if (e.target === containerRef.current || 
        e.target.classList.contains('file-list') ||
        e.target.classList.contains('file-list-container')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragRect({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
      // 드래그 시작 시 기존 선택 해제
      onFileSelect(null, false);
    }
  };

  // 드래그 중
  const handleMouseMove = (e) => {
    if (isDragging && dragStart) {
      const left = Math.min(e.clientX, dragStart.x);
      const top = Math.min(e.clientY, dragStart.y);
      const width = Math.abs(e.clientX - dragStart.x);
      const height = Math.abs(e.clientY - dragStart.y);
      
      setDragRect({ left, top, width, height });
    }
  };

  // 드래그 종료 - 선택 처리
  const handleMouseUp = (e) => {
    if (isDragging && dragRect) {
      const { left, top, width, height } = dragRect;
      
      // 최소 크기 이상일 때만 선택 처리 (실수 클릭 방지)
      if (width > 5 || height > 5) {
        const rect = { left, top, right: left + width, bottom: top + height };
        const fileElements = containerRef.current?.querySelectorAll('.file-item');
        
        if (fileElements) {
          fileElements.forEach((element, index) => {
            const elemRect = element.getBoundingClientRect();
            const isOverlapping = !(
              rect.right < elemRect.left ||
              rect.left > elemRect.right ||
              rect.bottom < elemRect.top ||
              rect.top > elemRect.bottom
            );

            if (isOverlapping && files[index]) {
              onFileSelect(files[index], true);
            }
          });
        }
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragRect(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, dragRect, files, selectedFiles]);

  if (loading) {
    return (
      <div className="file-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>파일 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="file-list-container">
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>이 폴더는 비어있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="file-list-container" 
      onClick={(e) => {
        closeContextMenu();
        handleContainerClick(e);
      }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
    >
      <div className="view-controls">
        <div className="navigation-controls">
          <button
            className="nav-btn"
            onClick={onGoBack}
            disabled={!canGoBack}
            title="뒤로 가기"
          >
            ◀
          </button>
          <button
            className="nav-btn"
            onClick={onGoForward}
            disabled={!canGoForward}
            title="앞으로 가기"
          >
            ▶
          </button>
        </div>
        
        <div className="view-mode-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="그리드 보기"
          >
            ⊞
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="리스트 보기"
          >
            ☰
          </button>
        </div>
      </div>

      <div className={`file-list ${viewMode}`}>
        {files.map((file) => (
          <FileItem
            key={file.path}
            file={file}
            selected={selectedFiles.some(f => f.path === file.path)}
            onSelect={(e) => onFileSelect(file, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => onDoubleClick(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            viewMode={viewMode}
            onDragStart={() => onDragStart(file)}
            onDragOver={(e) => onDragOver(e, file)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, file)}
            onDragEnd={onDragEnd}
            isDragging={draggedFile && draggedFile.path === file.path}
            isDragOver={dragOverFolder && dragOverFolder.path === file.path}
            darkMode={darkMode}
          />
        ))}
      </div>

      {/* 드래그 선택 박스 */}
      {isDragging && dragRect && (
        <div
          className="drag-select-box"
          style={{
            left: dragRect.left,
            top: dragRect.top,
            width: dragRect.width,
            height: dragRect.height,
          }}
        />
      )}

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={closeContextMenu}
          onRefresh={onRefresh}
          onCopy={onCopy}
          onCut={onCut}
          onPaste={onPaste}
          hasClipboard={hasClipboard}
        />
      )}
    </div>
  );
};

export default FileList;
