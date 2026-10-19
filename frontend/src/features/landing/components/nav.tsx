/**
 * Nav — floating pill navigation bar with mobile menu sheet.
 * Desktop: translucent pill with links, sign in, and a primary CTA.
 * Mobile: the pill collapses to brand + hamburger; a full-screen sheet opens.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Wordmark } from './wordmark';
import { Button } from './button';
import { ThemeToggle } from './theme-toggle';
import { useScrolled } from '../hooks/use-scrolled';
import { NAV_LINKS, SIGN_IN_LINK, START_ROOM_LINK } from '../data/nav-links';

interface NavProps {
  /** Light or dark colour scheme for the pill and sheet */
  tone?: 'light' | 'dark';
  /** Slot for the clock HUD (filled in slice 7) */
  hud?: ReactNode;
  className?: string;
}

export function Nav({ tone = 'light', hud, className }: NavProps) {
  const scrolled = useScrolled(80);
  const [open, setOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstSheetLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  /* Effect A: scroll lock, focus trap, Escape key, and breakpoint listener */
  useEffect(() => {
    if (!open) return;

    /* 1. Lock page scroll */
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /* 2. Move focus to the first sheet link */
    firstSheetLinkRef.current?.focus();

    /* 3. Keyboard: Escape closes, Tab wraps inside the sheet + menu button */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'Tab') {
        const focusable: HTMLElement[] = [];
        if (menuButtonRef.current) focusable.push(menuButtonRef.current);
        if (sheetRef.current) {
          const els = sheetRef.current.querySelectorAll<HTMLElement>('a, button');
          els.forEach((el) => focusable.push(el));
        }
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);

    /* 4. Close sheet when viewport grows past tablet breakpoint */
    const mql = window.matchMedia('(min-width: 768px)');
    function onBreakpoint(e: MediaQueryListEvent) {
      if (e.matches) close();
    }
    mql.addEventListener('change', onBreakpoint);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
      mql.removeEventListener('change', onBreakpoint);
    };
  }, [open, close]);

  const toneAttr = tone === 'dark' ? 'dark' : undefined;

  return (
    <>
      <header className={`l-nav-wrap${className ? ` ${className}` : ''}`}>
        <nav
          className="l-nav"
          aria-label="Main"
          data-tone={toneAttr}
          data-scrolled={scrolled ? 'true' : undefined}
        >
          {/* Brand */}
          <Link to="/" className="l-nav-brand" aria-label="[brackit] home">
            <Wordmark size={22} on={tone} />
          </Link>

          {/* Center: links + HUD slot */}
          <div className="l-nav-center">
            <ul className="l-nav-links">
              {NAV_LINKS.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link className="l-nav-link" to={item.to}>{item.label}</Link>
                  ) : (
                    <a className="l-nav-link" href={item.href}>{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
            {hud ? <div className="l-nav-hud">{hud}</div> : null}
          </div>

          {/* Right: sign in + CTA */}
          <div className="l-nav-actions">
            <ThemeToggle />
            <Link className="l-nav-link" to={SIGN_IN_LINK.to!}>{SIGN_IN_LINK.label}</Link>
            <Button to={START_ROOM_LINK.to} size="sm" on={tone}>{START_ROOM_LINK.label}</Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            ref={menuButtonRef}
            className="l-menu-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="l-nav-sheet"
            onClick={toggle}
          >
            {open
              ? <X size={20} aria-hidden="true" />
              : <Menu size={20} aria-hidden="true" />}
          </button>
        </nav>
      </header>

      {/* Mobile sheet */}
      <div
        id="l-nav-sheet"
        ref={sheetRef}
        className="l-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-open={open ? 'true' : 'false'}
        data-tone={toneAttr}
      >
        <ul className="l-sheet-list">
          {[...NAV_LINKS, SIGN_IN_LINK].map((item, i) => (
            <li key={item.label}>
              {item.to ? (
                <Link
                  ref={i === 0 ? firstSheetLinkRef : undefined}
                  className="l-sheet-link"
                  to={item.to}
                  onClick={close}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  ref={i === 0 ? firstSheetLinkRef : undefined}
                  className="l-sheet-link"
                  href={item.href}
                  onClick={close}
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="l-sheet-theme"><span className="l-sheet-theme-label">Theme</span><ThemeToggle /></div>
        <Button to={START_ROOM_LINK.to} size="lg" arrow fullWidth on={tone} onClick={close}>
          {START_ROOM_LINK.label}
        </Button>
      </div>
    </>
  );
}
