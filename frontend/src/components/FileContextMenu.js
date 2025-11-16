import React, { useEffect, useState } from 'react';
import { downloadFile, deleteFile, renameFile } from '../utils/api';
import { isVideoFile, isImageFile } from '../utils/helpers';
import './FileContextMenu.css';

const FileContextMenu = ({ x, y, file, onClose, onRefresh, onCopy, onCut, onPaste, hasClipboard }) => {
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const handleDownload = () => {
    if (!file.isDir) {
      downloadFile(file.path);
    }
    onClose();
  };

  const handleOpenWithPlayer = () => {
    // 비디오 파일을 다운로드 URL로 열기 (브라우저가 기본 플레이어나 설정된 앱으로 처리)
    const apiUrl = process.env.REACT_APP_API_URL || '/api';
    const videoUrl = `${apiUrl}/files/download?path=${encodeURIComponent(file.path)}`;
    
    // 새 창에서 열기 - 브라우저나 OS가 설정된 플레이어로 처리
    window.open(videoUrl, '_blank');
    onClose();
  };

  const handleImagePreview = () => {
    setShowImagePreview(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`"${file.name}"을(를) 삭제하시겠습니까?`)) {
      try {
        await deleteFile(file.path);
        onRefresh();
      } catch (error) {
        alert('삭제 실패: ' + error.message);
      }
    }
    onClose();
  };

  const handleRename = () => {
    setShowRename(true);
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(file);
    }
    onClose();
  };

  const handleCut = () => {
    if (onCut) {
      onCut(file);
    }
    onClose();
  };

  const handlePaste = () => {
    if (onPaste) {
      onPaste();
    }
    onClose();
  };

  const submitRename = async () => {
    if (newName && newName !== file.name) {
      try {
        await renameFile(file.path, newName);
        onRefresh();
        onClose();
      } catch (error) {
        alert('이름 변경 실패: ' + error.message);
      }
    }
  };

  // 화면 밖으로 나가지 않도록 위치 조정
  const menuStyle = {
    left: x,
    top: y,
  };

  const isVideo = isVideoFile(file.name);
  const isImage = isImageFile(file.name);
  const apiUrl = process.env.REACT_APP_API_URL || '/api';
  const imageUrl = `${apiUrl}/files/download?path=${encodeURIComponent(file.path)}`;

  return (
    <>
      <div className="context-menu" style={menuStyle} onClick={(e) => e.stopPropagation()}>
        {isImage && (
          <button className="context-menu-item" onClick={handleImagePreview}>
            🖼️ 미리보기
          </button>
        )}
        {!file.isDir && (
          <button className="context-menu-item" onClick={handleDownload}>
            ⬇️ 다운로드
          </button>
        )}
        {isVideo && (
          <button className="context-menu-item" onClick={handleOpenWithPlayer}>
            ▶️ 플레이어로 열기
          </button>
        )}
        <div className="context-menu-separator"></div>
        <button className="context-menu-item" onClick={handleCopy}>
          📋 복사 <span className="shortcut">Ctrl+C</span>
        </button>
        <button className="context-menu-item" onClick={handleCut}>
          ✂️ 잘라내기 <span className="shortcut">Ctrl+X</span>
        </button>
        {hasClipboard && (
          <button className="context-menu-item" onClick={handlePaste}>
            📌 붙여넣기 <span className="shortcut">Ctrl+V</span>
          </button>
        )}
        <div className="context-menu-separator"></div>
        <button className="context-menu-item" onClick={handleRename}>
          ✏️ 이름 변경
        </button>
        <button className="context-menu-item danger" onClick={handleDelete}>
          🗑️ 삭제 <span className="shortcut">Del</span>
        </button>
      </div>

      {showRename && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>이름 변경</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitRename()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn" onClick={onClose}>
                취소
              </button>
              <button className="btn btn-primary" onClick={submitRename}>
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {showImagePreview && (
        <div className="modal-overlay" onClick={() => setShowImagePreview(false)}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="image-preview-close" onClick={() => setShowImagePreview(false)}>
              ✕
            </button>
            <img src={imageUrl} alt={file.name} className="image-preview" />
            <div className="image-preview-info">
              <span>{file.name}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileContextMenu;