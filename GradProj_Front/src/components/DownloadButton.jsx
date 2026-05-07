import React, { useState } from 'react';
import { extractBlobFromResult, extractFileNameFromHeaders, triggerBrowserDownload } from '../utils/downloadFile';

const DownloadButton = ({
  apiCall,
  fileName = 'download',
  children = 'Download',
  onError,
  onSuccess,
  className = '',
  disabled = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    setIsDownloading(true);

    try {
      const result = await apiCall();
      const blob = extractBlobFromResult(result);
      const resolvedFileName = extractFileNameFromHeaders(result?.headers, fileName);

      triggerBrowserDownload(blob, resolvedFileName);
      onSuccess?.(result);
    } catch (error) {
      onError?.(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick} disabled={disabled || isDownloading}>
      {isDownloading ? 'Downloading...' : children}
    </button>
  );
};

export default DownloadButton;
