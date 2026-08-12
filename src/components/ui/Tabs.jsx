import React, { useState, useCallback, Children } from 'react';
import clsx from 'clsx';

export function Tabs({ tabs, defaultIndex = 0, onChange, className, tabClassName }) {
  const [active, setActive] = useState(defaultIndex);

  const select = useCallback(
    (index) => {
      setActive(index);
      onChange?.(index);
    },
    [onChange],
  );

  const items = Children.toArray(tabs);

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex gap-1 p-1 bg-bg-surface border border-border rounded-lg overflow-x-auto" role="tablist">
        {items.map((tab, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => select(index)}
            className={clsx(
              'min-h-11 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              active === index
                ? 'bg-primary text-black'
                : 'text-text-muted hover:text-text hover:bg-bg-hover',
              tabClassName,
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Tabs;
