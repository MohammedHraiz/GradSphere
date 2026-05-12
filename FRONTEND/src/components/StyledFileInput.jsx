import { useEffect, useId, useRef, useState } from 'react';
import './StyledControls.css';

const inferButtonLabel = (accept) => {
  const normalizedAccept = String(accept || '').toLowerCase();
  if (normalizedAccept.includes('image/')) {
    return 'Choose Image';
  }
  return 'Choose File';
};

const StyledFileInput = ({
  id,
  name,
  accept,
  disabled = false,
  required = false,
  className = '',
  style,
  buttonLabel,
  placeholder = 'No file chosen',
  onChange,
  ...rest
}) => {
  const generatedId = useId().replaceAll(':', '');
  const inputId = id ?? `styled-file-input-${generatedId}`;
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return undefined;

    const handleReset = () => setFileName('');
    form.addEventListener('reset', handleReset);
    return () => form.removeEventListener('reset', handleReset);
  }, []);

  const handleChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFileName(nextFile?.name ?? '');
    onChange?.(event);
  };

  return (
    <div className={`styled-file-input ${className}`.trim()} style={style} data-disabled={disabled ? 'true' : 'false'}>
      <input
        {...rest}
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        className="styled-file-input-native hidden-input"
        accept={accept}
        required={required}
        disabled={disabled}
        onChange={handleChange}
      />
      <div className="styled-file-input-shell" onClick={() => !disabled && inputRef.current?.click()} role="presentation">
        <button
          type="button"
          className="styled-file-input-button"
          disabled={disabled}
          onClick={(event) => {
            event.preventDefault();
            inputRef.current?.click();
          }}
        >
          {buttonLabel || inferButtonLabel(accept)}
        </button>
        <span className={`styled-file-input-name ${fileName ? '' : 'is-placeholder'}`}>{fileName || placeholder}</span>
      </div>
    </div>
  );
};

export default StyledFileInput;
