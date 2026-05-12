import { Children, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './StyledControls.css';

const getOptionLabel = (children) => {
  const nodes = Children.toArray(children);
  return nodes.map((node) => {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }
    if (node?.props?.children) {
      return getOptionLabel(node.props.children);
    }
    return '';
  }).join('').trim();
};

const flattenOptions = (children) => (
  Children.toArray(children).flatMap((child) => {
    if (!child || typeof child === 'string' || typeof child === 'number') {
      return [];
    }

    if (child.type === 'option') {
      return [{
        value: String(child.props.value ?? ''),
        label: getOptionLabel(child.props.children) || String(child.props.value ?? ''),
        disabled: Boolean(child.props.disabled),
      }];
    }

    if (child.type === 'optgroup') {
      return flattenOptions(child.props.children);
    }

    return [];
  })
);

const createSyntheticEvent = (value, name, id) => ({
  target: { value, name, id },
  currentTarget: { value, name, id },
  preventDefault() {},
  stopPropagation() {},
});

const getInitialValue = (options, value, defaultValue) => {
  const explicitValue = value ?? defaultValue;
  if (explicitValue !== undefined && explicitValue !== null) {
    return String(explicitValue);
  }
  if (options.some((option) => option.value === '')) {
    return '';
  }
  return options[0]?.value ?? '';
};

const getNextEnabledIndex = (options, startIndex, direction) => {
  if (!options.length) return -1;

  let currentIndex = startIndex;
  for (let attempt = 0; attempt < options.length; attempt += 1) {
    currentIndex = (currentIndex + direction + options.length) % options.length;
    if (!options[currentIndex]?.disabled) {
      return currentIndex;
    }
  }
  return -1;
};

const StyledSelect = ({
  id,
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  className = '',
  style,
  children,
  ...rest
}) => {
  const generatedId = useId().replaceAll(':', '');
  const controlId = id ?? `styled-select-${generatedId}`;
  const listboxId = `${controlId}-listbox`;
  const nativeId = `${controlId}-native`;
  const options = useMemo(() => flattenOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => getInitialValue(options, value, defaultValue));
  const selectedValue = isControlled ? String(value ?? '') : internalValue;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isControlled) {
      setInternalValue(String(value ?? ''));
    }
  }, [isControlled, value]);

  useEffect(() => {
    if (!options.some((option) => option.value === selectedValue)) {
      const nextValue = getInitialValue(options, value, defaultValue);
      setInternalValue(nextValue);
    }
  }, [defaultValue, options, selectedValue, value]);

  const selectedOption = options.find((option) => option.value === selectedValue) ?? null;

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const computed = window.getComputedStyle(triggerRef.current);
    const menuHeight = Math.min(menuRef.current?.offsetHeight ?? 280, 320);
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const shouldOpenUp = spaceBelow < Math.min(220, menuHeight) && spaceAbove > spaceBelow;
    const top = shouldOpenUp
      ? Math.max(12, rect.top - menuHeight - 8)
      : Math.min(window.innerHeight - menuHeight - 12, rect.bottom + 8);

    setMenuStyle({
      top,
      left: Math.max(12, rect.left),
      width: rect.width,
      maxHeight: Math.max(180, shouldOpenUp ? spaceAbove : spaceBelow),
      '--styled-select-menu-bg': computed.backgroundColor || '#ffffff',
      '--styled-select-menu-border': computed.borderColor || '#dbe2ea',
      '--styled-select-menu-color': computed.color || '#0f172a',
      '--styled-select-radius': computed.borderRadius || '14px',
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    updateMenuPosition();
    const frame = window.requestAnimationFrame(updateMenuPosition);
    const handleViewportChange = () => updateMenuPosition();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const syncValue = (nextValue) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(createSyntheticEvent(nextValue, name, controlId));
  };

  const openMenu = () => {
    if (disabled || !options.length) return;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    const firstEnabledIndex = options.findIndex((option) => !option.disabled);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    syncValue(option.value);
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((current) => getNextEnabledIndex(options, current, direction));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      } else if (highlightedIndex >= 0) {
        handleSelect(options[highlightedIndex]);
      }
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((current) => getNextEnabledIndex(options, current, direction));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (highlightedIndex >= 0) {
        handleSelect(options[highlightedIndex]);
      }
    }
  };

  return (
    <>
      <div ref={rootRef} className="styled-select">
        <select
          id={nativeId}
          className="styled-select-native"
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={selectedValue}
          required={required}
          disabled={disabled}
          onChange={() => {}}
        >
          {children}
        </select>
        <button
          {...rest}
          ref={triggerRef}
          id={controlId}
          type="button"
          className={`styled-select-trigger ${isOpen ? 'is-open' : ''} ${className}`.trim()}
          style={style}
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onClick={() => (isOpen ? closeMenu() : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
        >
          <span className={`styled-select-value ${selectedOption ? '' : 'is-placeholder'}`}>{selectedOption?.label || 'Select an option'}</span>
          <span className="styled-select-caret" aria-hidden="true" />
        </button>
      </div>

      {isOpen && menuStyle ? createPortal(
        <div className="styled-select-portal" style={menuStyle}>
          <div
            ref={menuRef}
            id={listboxId}
            className="styled-select-menu"
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
          >
            {options.map((option, index) => {
              const isSelected = option.value === selectedValue;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  className={`styled-select-option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`.trim()}
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                >
                  <span>{option.label}</span>
                  {isSelected ? <span className="styled-select-option-check">✓</span> : null}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
};

export default StyledSelect;
