import './SearchBar.css';

const SearchIcon = () => (
  <svg className="portal-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
  </svg>
);

const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  disabled = false,
  className = '',
  inputClassName = '',
  id,
  name,
  variant = 'light',
}) => {
  const hasValue = Boolean(String(value ?? '').length);

  return (
    <div className={['portal-search', variant === 'dark' ? 'portal-search--dark' : '', className].filter(Boolean).join(' ')}>
      <SearchIcon />
      <input
        id={id}
        name={name}
        className={['portal-search__input', inputClassName].filter(Boolean).join(' ')}
        type="search"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        autoComplete="off"
      />
      {hasValue && onClear ? (
        <button type="button" className="portal-search__clear" onClick={onClear} aria-label="Clear search">
          Clear
        </button>
      ) : null}
    </div>
  );
};

export default SearchBar;
