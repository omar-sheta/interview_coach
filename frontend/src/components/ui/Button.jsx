import { motion } from 'framer-motion';

/**
 * Button - Themed button component
 * Variants: primary (neon), secondary (outline), ghost, success, danger
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'neon-button',
        secondary: 'bg-transparent border border-slate-600 text-slate-200 hover:bg-slate-800 hover:border-slate-500',
        ghost: 'ghost-button',
        success: 'bg-success hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        danger: 'bg-danger hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    };

    const sizes = {
        sm: 'py-1.5 px-3 text-xs',
        md: 'py-2.5 px-5 text-sm',
        lg: 'py-3 px-6 text-base',
    };

    return (
        <motion.button
            className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={18} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={18} />}
                </>
            )}
        </motion.button>
    );
};

export default Button;
