import * as React from 'react';
import { cn } from '../utils/cn';

export interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className,
}) => {
  // Track open item IDs
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    items.forEach((item) => {
      if (item.defaultOpen) initial.add(item.id);
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-cream-300 border-y border-cream-300', className)}>
      {items.map((item, index) => {
        const isOpen = openIds.has(item.id);
        const headerId = `accordion-header-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div key={item.id} className="py-2">
            <h3 className="m-0 p-0">
              <button
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'w-full flex items-center justify-between py-3 px-2 text-left font-accent font-semibold text-heading-md text-charcoal-950',
                  'rounded-lg transition-colors hover:text-raspberry-700 hover:bg-cream-100',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-raspberry-500/30'
                )}
              >
                <div className="flex flex-col gap-0.5 pr-4">
                  <span>{item.title}</span>
                  {item.subtitle && (
                    <span className="text-xs font-normal text-charcoal-700">
                      {item.subtitle}
                    </span>
                  )}
                </div>

                {/* Animated Chevron Icon */}
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-200 text-charcoal-950 transition-transform duration-200',
                    isOpen && 'rotate-180 bg-pink-100 text-raspberry-700'
                  )}
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>
            </h3>

            {/* Collapsible Panel */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className={cn(
                'px-2 pt-2 pb-4 text-body-md text-charcoal-700 leading-relaxed transition-all duration-200',
                !isOpen && 'hidden'
              )}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

Accordion.displayName = 'Accordion';

export default Accordion;
