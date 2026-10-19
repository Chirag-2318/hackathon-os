/**
 * Button — landing page pill button. Size 'sm' is for the nav, 'lg' for everything else.
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'lg';
  on?: 'light' | 'dark';
  /** Show an ArrowRight icon after the label */
  arrow?: boolean;
  fullWidth?: boolean;
  /** Router link destination */
  to?: string;
  /** Plain anchor destination */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit';
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'lg',
  on = 'light',
  arrow = false,
  fullWidth = false,
  to,
  href,
  onClick,
  type = 'button',
  className,
  children,
}: ButtonProps) {
  const cls = `l-btn l-btn--${variant} l-btn--${size}${className ? ` ${className}` : ''}`;
  const dataOn = on;
  const dataFull = fullWidth ? 'true' : undefined;

  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="l-btn-arrow" size={16} aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} data-on={dataOn} data-full={dataFull} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={cls} data-on={dataOn} data-full={dataFull} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={cls} data-on={dataOn} data-full={dataFull} onClick={onClick}>
      {content}
    </button>
  );
}
