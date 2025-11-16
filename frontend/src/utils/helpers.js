// 파일 크기를 읽기 쉬운 형식으로 변환
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 파일 확장자에 따른 아이콘 가져오기
export const getFileIcon = (fileName, isDir) => {
  if (isDir) return '📁';
  
  const ext = fileName.split('.').pop().toLowerCase();
  
  const iconMap = {
    // 이미지
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    // 비디오
    mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬', wmv: '🎬',
    // 오디오
    mp3: '🎵', wav: '🎵', flac: '🎵', m4a: '🎵',
    // 문서
    pdf: '📄', doc: '📝', docx: '📝', txt: '📝', md: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📊', pptx: '📊',
    // 압축
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    // 코드
    js: '📜', jsx: '📜', ts: '📜', tsx: '📜',
    py: '🐍', go: '🔵', java: '☕',
    html: '🌐', css: '🎨', json: '📋',
  };
  
  return iconMap[ext] || '📄';
};

// 파일 타입 체크
export const isImageFile = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif'].includes(ext);
};

export const isVideoFile = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ts', 'mts'].includes(ext);
};

export const isAudioFile = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext);
};

// 경로 정규화
export const normalizePath = (path) => {
  if (!path || path === '/') return '/';
  return path.startsWith('/') ? path : '/' + path;
};

// 부모 경로 가져오기
export const getParentPath = (path) => {
  if (!path || path === '/') return '/';
  const parts = path.split('/').filter(p => p);
  parts.pop();
  return '/' + parts.join('/');
};

// 날짜 포맷팅
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};