import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  title,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed select-none shadow-xs';

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
    lg: 'h-10 px-4 text-sm gap-2'
  };

  const variantStyles = {
    // Primary: Teal Green (#02968A)
    primary: 'bg-brand-teal hover:bg-brand-teal-hover active:bg-brand-teal-dark text-white shadow-xs focus-visible:ring-brand-teal disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
    // Secondary: Blue / Navy accent
    secondary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus-visible:ring-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
    // Success: Green
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-xs focus-visible:ring-emerald-500 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none',
    // Highlight: Teal Green solid highlight
    highlight: 'bg-brand-teal hover:bg-brand-teal-hover active:bg-brand-teal-dark text-white font-extrabold shadow-xs focus-visible:ring-brand-teal disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none',
    // Danger: Red for cancellation
    danger: 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 shadow-xs focus-visible:ring-rose-500 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-300 disabled:shadow-none',
    // Outline: Clean border with Teal Green text
    outline: 'bg-white hover:bg-brand-teal-light/50 active:bg-brand-teal-light text-brand-teal border border-brand-teal/30 hover:border-brand-teal shadow-xs focus-visible:ring-brand-teal disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-300 disabled:shadow-none',
    // Ghost
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-brand-teal focus-visible:ring-brand-teal disabled:text-slate-300 shadow-none'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}

export default Button;
