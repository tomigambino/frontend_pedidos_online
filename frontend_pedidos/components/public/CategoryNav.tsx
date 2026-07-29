'use client';
import { useEffect, useRef, useState } from 'react';

interface Category {
  id: string;
  name: string;
}

const SCROLL_OFFSET = 150;

export function CategoryNav({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const getActiveSection = () => {
      const atBottom =
        window.innerHeight + Math.ceil(window.scrollY) >=
        document.documentElement.scrollHeight - 2;
      if (atBottom && categories.length > 0) {
        return `section-${categories[categories.length - 1].id}`;
      }

      let current: string | null = null;
      for (const cat of categories) {
        const el = document.getElementById(`section-${cat.id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= SCROLL_OFFSET) {
          current = `section-${cat.id}`;
        } else {
          break;
        }
      }
      return current ?? (categories[0] ? `section-${categories[0].id}` : null);
    };

    const hash = window.location.hash.replace('#', '');
    if (hash && categories.some((c) => `section-${c.id}` === hash)) {
      setActiveId(hash);
    } else {
      setActiveId(getActiveSection());
    }

    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        setActiveId(getActiveSection());
        rafId.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [categories]);

  const scrollTo = (id: string) => {
    setActiveId(`section-${id}`);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex gap-3 p-3 overflow-x-auto hide-scrollbar">
      {categories.map((cat) => {
        const isActive = activeId === `section-${cat.id}`;
        return (
          <button
            key={cat.id}
            onClick={() => scrollTo(cat.id)}
            className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors ${
              isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-gray-100 text-[var(--color-foreground)] hover:bg-gray-200'
            }`}
          >
            <span className="text-sm font-medium leading-normal">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
