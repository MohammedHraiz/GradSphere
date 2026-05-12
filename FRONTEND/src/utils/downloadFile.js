const getHeaderValue = (headers, headerName) => {
  if (!headers) {
    return '';
  }

  if (typeof headers.get === 'function') {
    return headers.get(headerName) || headers.get(headerName.toLowerCase()) || '';
  }

  const normalizedHeaderName = headerName.toLowerCase();
  return headers[normalizedHeaderName] || headers[headerName] || '';
};

export const extractFileNameFromHeaders = (headers, fallbackName = 'download') => {
  const contentDisposition = getHeaderValue(headers, 'content-disposition');
  const fileNameMatch = /filename\*?=(?:UTF-8''|"?)([^";\n]+)/i.exec(contentDisposition || '');

  if (fileNameMatch?.[1]) {
    return decodeURIComponent(fileNameMatch[1].replace(/"/g, '').trim());
  }

  return fallbackName;
};

export const extractBlobFromResult = (result) => {
  if (result instanceof Blob) {
    return result;
  }

  if (result?.data instanceof Blob) {
    return result.data;
  }

  return null;
};

export const triggerBrowserDownload = (blob, fileName) => {
  if (!blob) {
    throw new Error('No downloadable file was returned by the API.');
  }

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const openBlobInNewTab = (blob) => {
  if (!blob) {
    throw new Error('No viewable file was returned by the API.');
  }

  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};
