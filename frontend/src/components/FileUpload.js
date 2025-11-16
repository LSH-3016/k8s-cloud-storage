import React, { useRef } from 'react';
import './FileUpload.css';

const FileUpload = ({ onUpload }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button className="btn btn-upload" onClick={handleClick}>
        📤 업로드
      </button>
    </>
  );
};

export default FileUpload;
