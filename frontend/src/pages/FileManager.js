import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from '../components/FileList';
import FileUpload from '../components/FileUpload';
import Breadcrumb from '../components/Breadcrumb';
import { fetchFiles, uploadFile, createDirectory, deleteFile, copyFile, moveFile, renameFile } from '../utils/api';
import { normalizePath, isImageFile } from '../utils/helpers';
import './FileManager.css';

const FileManager = ({ darkMode, username }) => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 기본 5초
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [clipboard, setClipboard] = useState(null); // { files: [], operation: 'copy' | 'cut' }
  const [isPasting, setIsPasting] = useState(false);
  const fileManagerRef = useRef(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [pathHistory, setPathHistory] = useState(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // 실행 취소 스택
  const [actionHistory, setActionHistory] = useState([]);
  const [actionHistoryIndex, setActionHistoryIndex] = useState(-1);
  
  // 드래그 앤 드롭 상태
  const [draggedFile, setDraggedFile] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  
  // 토스트 알림 상태
  const [toasts, setToasts] = useState([]);
  const [toastId, setToastId] = useState(0);
  
  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm, onCancel }

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  // 토스트 알림 표시
  const showToast = (message, type = 'info') => {
    const id = toastId;
    setToastId(id + 1);
    
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // 3초 후 자동 제거
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // 확인 모달 표시
  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        message,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        }
      });
    });
  };

  // 자동 새로고침 (선택한 주기마다)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadFiles(currentPath);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentPath, refreshInterval]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 입력 필드에서는 단축키 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl+Z: 실행 취소
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y 또는 Ctrl+Shift+Z: 다시 실행
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+C 또는 Cmd+C: 복사
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedFiles.length > 0) {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl+X 또는 Cmd+X: 잘라내기
      else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedFiles.length > 0) {
        e.preventDefault();
        handleCut();
      }
      // Ctrl+V 또는 Cmd+V: 붙여넣기
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        handlePaste();
      }
      // Delete 또는 Backspace: 삭제
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFiles.length > 0) {
        e.preventDefault();
        handleDelete();
      }
      // Ctrl+A 또는 Cmd+A: 전체 선택
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Escape: 선택 해제
      else if (e.key === 'Escape') {
        setSelectedFiles([]);
        setClipboard(null);
        setShowActionsMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, clipboard, currentPath, files, actionHistoryIndex, actionHistory]);

  // 외부 클릭으로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showActionsMenu && !e.target.closest('.actions-dropdown')) {
        setShowActionsMenu(false);
      }
      if (showRefreshMenu && !e.target.closest('.refresh-control')) {
        setShowRefreshMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showActionsMenu, showRefreshMenu]);

  const loadFiles = async (path) => {
    setLoading(true);
    try {
      const data = await fetchFiles(username, path);
      setFiles(data.files || []);
      setCurrentPath(data.currentPath || path);
    } catch (error) {
      console.error('Failed to load files:', error);
      showToast('파일 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    const newPath = normalizePath(path);
    
    // 히스토리 업데이트
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(newPath);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    setCurrentPath(newPath);
    setSelectedFiles([]);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
      setSelectedFiles([]);
    }
  };

  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
      setSelectedFiles([]);
    }
  };

  const handleFileSelect = (file, isMulti = false) => {
    // null이면 선택 해제
    if (file === null) {
      setSelectedFiles([]);
      return;
    }
    
    if (isMulti) {
      setSelectedFiles(prev => {
        const exists = prev.find(f => f.path === file.path);
        if (exists) {
          return prev.filter(f => f.path !== file.path);
        }
        return [...prev, file];
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleDoubleClick = (file) => {
    if (file.isDir) {
      handleNavigate(file.path);
    } else if (isImageFile(file.name)) {
      setPreviewImage(file);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showToast('폴더 이름을 입력해주세요.', 'warning');
      return;
    }

    try {
      await createDirectory(username, currentPath, newFolderName);
      
      // 히스토리에 추가
      addToHistory({
        type: 'create',
        parentPath: currentPath,
        name: newFolderName,
        path: normalizePath(`${currentPath}/${newFolderName}`)
      });
      
      setNewFolderName('');
      setShowNewFolder(false);
      await loadFiles(currentPath);
      showToast('폴더가 생성되었습니다.', 'success');
    } catch (error) {
      console.error('Failed to create folder:', error);
      showToast('폴더 생성에 실패했습니다.', 'error');
    }
  };

  const handleUpload = async (files) => {
    const uploadPromises = files.map(async (file) => {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        await uploadFile(username, file, currentPath);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (error) {
        console.error('Failed to upload file:', error);
        showToast(`파일 업로드 실패: ${file.name}`, 'error');
      }
    });
    
    await Promise.all(uploadPromises);
    
    setTimeout(() => {
      setUploadProgress({});
      loadFiles(currentPath);
      showToast(`${files.length}개 파일이 업로드되었습니다.`, 'success');
    }, 500);
  };

  // 복사 (Ctrl+C)
  const handleCopy = () => {
    if (selectedFiles.length === 0) return;
    setClipboard({
      files: [...selectedFiles],
      operation: 'copy'
    });
    console.log(`${selectedFiles.length}개 파일 복사됨`);
  };

  // 잘라내기 (Ctrl+X)
  const handleCut = () => {
    if (selectedFiles.length === 0) return;
    setClipboard({
      files: [...selectedFiles],
      operation: 'cut'
    });
    console.log(`${selectedFiles.length}개 파일 잘라내기됨`);
  };

  // 붙여넣기 (Ctrl+V)
  const handlePaste = async () => {
    if (!clipboard || clipboard.files.length === 0 || isPasting) return;

    setIsPasting(true);
    
    try {
      const promises = clipboard.files.map(async (file) => {
        const fileName = file.name;
        const destinationPath = normalizePath(`${currentPath}/${fileName}`);
        
        if (clipboard.operation === 'copy') {
          // 복사
          await copyFile(username, file.path, destinationPath);
          addToHistory({
            type: 'copy',
            source: file.path,
            destination: destinationPath
          });
        } else if (clipboard.operation === 'cut') {
          // 이동 (잘라내기)
          await moveFile(username, file.path, destinationPath);
          addToHistory({
            type: 'move',
            source: file.path,
            destination: destinationPath
          });
        }
      });

      await Promise.all(promises);
      
      // 잘라내기였다면 클립보드 비우기
      if (clipboard.operation === 'cut') {
        setClipboard(null);
      }
      
      setSelectedFiles([]);
      await loadFiles(currentPath);
      showToast(`${clipboard.files.length}개 파일이 ${clipboard.operation === 'copy' ? '복사' : '이동'}되었습니다.`, 'success');
    } catch (error) {
      console.error('Failed to paste:', error);
      showToast(`붙여넣기 실패: ${error.message}`, 'error');
    } finally {
      setIsPasting(false);
    }
  };

  // 삭제 (Delete)
  const handleDelete = async () => {
    if (selectedFiles.length === 0) return;

    const confirmMsg = `${selectedFiles.length}개의 파일/폴더를 삭제하시겠습니까?\n삭제된 파일은 복구할 수 없습니다.`;
    const confirmed = await showConfirm(confirmMsg);
    if (!confirmed) return;

    try {
      const deletedFiles = [...selectedFiles];
      const promises = selectedFiles.map(file => deleteFile(username, file.path));
      await Promise.all(promises);
      
      // 삭제는 취소 불가능하므로 히스토리에 기록만
      addToHistory({
        type: 'delete',
        files: deletedFiles
      });
      
      setSelectedFiles([]);
      await loadFiles(currentPath);
      showToast(`${deletedFiles.length}개 파일이 삭제되었습니다.`, 'success');
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast(`삭제 실패: ${error.message}`, 'error');
    }
  };

  // 전체 선택 (Ctrl+A)
  const handleSelectAll = () => {
    setSelectedFiles([...files]);
  };

  // 액션 히스토리에 추가
  const addToHistory = (action) => {
    const newHistory = actionHistory.slice(0, actionHistoryIndex + 1);
    newHistory.push(action);
    setActionHistory(newHistory);
    setActionHistoryIndex(newHistory.length - 1);
  };

  // 실행 취소 (Ctrl+Z)
  const handleUndo = async () => {
    if (actionHistoryIndex < 0) return;

    const action = actionHistory[actionHistoryIndex];
    
    try {
      switch (action.type) {
        case 'delete':
          // 삭제 취소는 불가능 (복원 기능 필요)
          showToast('삭제 작업은 취소할 수 없습니다.', 'warning');
          return;
          
        case 'move':
          // 이동 취소 - 원래 위치로 되돌리기
          await moveFile(username, action.destination, action.source);
          break;
          
        case 'copy':
          // 복사 취소 - 복사된 파일 삭제
          await deleteFile(username, action.destination);
          break;
          
        case 'rename':
          // 이름 변경 취소 - 원래 이름으로 되돌리기
          await renameFile(username, action.newPath, action.oldName);
          break;
          
        case 'create':
          // 폴더 생성 취소 - 생성된 폴더 삭제
          await deleteFile(username, action.path);
          break;
      }
      
      setActionHistoryIndex(actionHistoryIndex - 1);
      await loadFiles(currentPath);
      showToast('작업이 취소되었습니다.', 'success');
    } catch (error) {
      console.error('Undo failed:', error);
      showToast(`취소 실패: ${error.message}`, 'error');
    }
  };

  // 다시 실행 (Ctrl+Y)
  const handleRedo = async () => {
    if (actionHistoryIndex >= actionHistory.length - 1) return;

    const action = actionHistory[actionHistoryIndex + 1];
    
    try {
      switch (action.type) {
        case 'move':
          await moveFile(username, action.source, action.destination);
          break;
          
        case 'copy':
          await copyFile(username, action.source, action.destination);
          break;
          
        case 'rename':
          await renameFile(username, action.oldPath, action.newName);
          break;
          
        case 'create':
          await createDirectory(username, action.parentPath, action.name);
          break;
      }
      
      setActionHistoryIndex(actionHistoryIndex + 1);
      await loadFiles(currentPath);
      showToast('작업이 다시 실행되었습니다.', 'success');
    } catch (error) {
      console.error('Redo failed:', error);
      showToast(`다시 실행 실패: ${error.message}`, 'error');
    }
  };

  // 드래그 시작
  const handleDragStart = (file) => {
    setDraggedFile(file);
  };

  // 드래그 오버
  const handleDragOver = (e, folder) => {
    e.preventDefault();
    if (folder && folder.isDir) {
      setDragOverFolder(folder);
    }
  };

  // 드래그 떠남
  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  // 드롭
  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (!draggedFile || !targetFolder || !targetFolder.isDir) return;
    if (draggedFile.path === targetFolder.path) return; // 자기 자신에게는 드롭 불가
    
    try {
      const fileName = draggedFile.name;
      const destinationPath = normalizePath(`${targetFolder.path}/${fileName}`);
      
      // 이동 실행
      await moveFile(username, draggedFile.path, destinationPath);
      
      // 히스토리에 추가
      addToHistory({
        type: 'move',
        source: draggedFile.path,
        destination: destinationPath
      });
      
      setDraggedFile(null);
      await loadFiles(currentPath);
      showToast(`"${fileName}"을(를) "${targetFolder.name}"(으)로 이동했습니다.`, 'success');
    } catch (error) {
      console.error('Failed to move file:', error);
      showToast(`이동 실패: ${error.message}`, 'error');
    }
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedFile(null);
    setDragOverFolder(null);
  };

  const onDrop = useCallback((acceptedFiles) => {
    handleUpload(acceptedFiles);
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div 
      className="file-manager" 
      {...getRootProps()}
      ref={fileManagerRef}
      tabIndex={0}
    >
      <input {...getInputProps()} />
      
      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-message">
            <span>📁</span>
            <p>파일을 놓아주세요</p>
          </div>
        </div>
      )}

      <div className="file-manager-header">
        <div className="breadcrumb-container">
          <Breadcrumb currentPath={currentPath} onNavigate={handleNavigate} />
        </div>
        
        <div className="toolbar">
          {/* 실행 취소/다시 실행 */}
          <div className="undo-redo-controls">
            <button 
              className="btn"
              onClick={handleUndo}
              disabled={actionHistoryIndex < 0}
              title="실행 취소 (Ctrl+Z)"
            >
              ↶ 실행 취소
            </button>
            <button 
              className="btn"
              onClick={handleRedo}
              disabled={actionHistoryIndex >= actionHistory.length - 1}
              title="다시 실행 (Ctrl+Y)"
            >
              ↷ 다시 실행
            </button>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setShowNewFolder(true)}
          >
            📁 새 폴더
          </button>
          
          <FileUpload onUpload={handleUpload} />

          {/* 작업 드롭다운 메뉴 */}
          <div className="actions-dropdown">
            <button 
              className="btn"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              disabled={selectedFiles.length === 0 && !clipboard}
              title="작업"
            >
              ⚡ 작업 {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </button>
            {showActionsMenu && (
              <div className="actions-menu">
                <button 
                  onClick={() => { handleCopy(); setShowActionsMenu(false); }}
                  disabled={selectedFiles.length === 0}
                  className="actions-menu-item"
                >
                  📋 복사 <span className="shortcut">Ctrl+C</span>
                </button>
                <button 
                  onClick={() => { handleCut(); setShowActionsMenu(false); }}
                  disabled={selectedFiles.length === 0}
                  className="actions-menu-item"
                >
                  ✂️ 잘라내기 <span className="shortcut">Ctrl+X</span>
                </button>
                <button 
                  onClick={() => { handlePaste(); setShowActionsMenu(false); }}
                  disabled={!clipboard || isPasting}
                  className="actions-menu-item"
                >
                  📌 붙여넣기 <span className="shortcut">Ctrl+V</span>
                </button>
                <div className="actions-menu-separator"></div>
                <button 
                  onClick={() => { handleDelete(); setShowActionsMenu(false); }}
                  disabled={selectedFiles.length === 0}
                  className="actions-menu-item danger"
                >
                  🗑️ 삭제 <span className="shortcut">Del</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="refresh-control">
            <button
              className={`btn ${autoRefresh ? 'btn-active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={`자동 새로고침 (${refreshInterval / 1000}초마다)`}
            >
              {autoRefresh ? `🔄 자동새로고침 ${refreshInterval / 1000}초` : '⭕ 자동새로고침 OFF'}
            </button>
            <button
              className="btn refresh-settings"
              onClick={() => setShowRefreshMenu(!showRefreshMenu)}
              title="새로고침 주기 설정"
            >
              ⚙️
            </button>
            {showRefreshMenu && (
              <div className="refresh-menu">
                <button onClick={() => { setRefreshInterval(3000); setShowRefreshMenu(false); }}>
                  3초
                </button>
                <button onClick={() => { setRefreshInterval(5000); setShowRefreshMenu(false); }}>
                  5초
                </button>
                <button onClick={() => { setRefreshInterval(10000); setShowRefreshMenu(false); }}>
                  10초
                </button>
                <button onClick={() => { setRefreshInterval(30000); setShowRefreshMenu(false); }}>
                  30초
                </button>
                <button onClick={() => { setRefreshInterval(60000); setShowRefreshMenu(false); }}>
                  1분
                </button>
              </div>
            )}
          </div>
          
          {selectedFiles.length > 0 && (
            <span className="selection-info">
              {selectedFiles.length}개 선택됨
            </span>
          )}

          {clipboard && (
            <span className="clipboard-info">
              📋 {clipboard.operation === 'copy' ? '복사됨' : '잘라내기됨'}: {clipboard.files.length}개
            </span>
          )}
        </div>
      </div>

      {showNewFolder && (
        <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>새 폴더 만들기</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="폴더 이름"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowNewFolder(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleCreateFolder}>
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="upload-item">
              <span>{name}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <FileList
        files={files}
        loading={loading}
        selectedFiles={selectedFiles}
        onFileSelect={handleFileSelect}
        onDoubleClick={handleDoubleClick}
        onRefresh={() => loadFiles(currentPath)}
        onCopy={(file) => {
          setSelectedFiles([file]);
          handleCopy();
        }}
        onCut={(file) => {
          setSelectedFiles([file]);
          handleCut();
        }}
        onPaste={handlePaste}
        hasClipboard={clipboard !== null}
        onGoBack={goBack}
        onGoForward={goForward}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < pathHistory.length - 1}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        draggedFile={draggedFile}
        dragOverFolder={dragOverFolder}
        darkMode={darkMode}
      />

      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="image-preview-close" onClick={() => setPreviewImage(null)}>
              ✕
            </button>
            <img 
              src={`/api/files/download?path=${encodeURIComponent(previewImage.path)}`} 
              alt={previewImage.name} 
              className="image-preview" 
            />
            <div className="image-preview-info">
              <span>{previewImage.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* 확인 모달 */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">⚠️</div>
            <h3>확인</h3>
            <p className="confirm-message">{confirmModal.message}</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={confirmModal.onCancel}>
                취소
              </button>
              <button className="btn btn-danger" onClick={confirmModal.onConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;