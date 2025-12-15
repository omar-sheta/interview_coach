import { motion } from 'framer-motion';

/**
 * Badge - Status pill component
 * Variants: success, danger, primary, locked, default
 */
export const Badge = ({
    children,
    variant = 'default',
    icon: Icon,
    pulse = false,
    className = ''
}) => {
    const variants = {
        success: 'badge-success',
        danger: 'badge-danger',
        primary: 'badge-primary',
        locked: 'badge-locked',
        default: 'bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-medium px-3 py-1 rounded-full',
    };

    return (
        <motion.span
            className={`inline-flex items-center gap-1.5 ${variants[variant]} ${className}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {pulse && (
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${variant === 'success' ? 'bg-success' :
                        variant === 'danger' ? 'bg-danger' :
                            variant === 'primary' ? 'bg-primary-blue' : 'bg-slate-400'
                    }`} />
            )}
            {Icon && <Icon size={14} />}
            {children}
        </motion.span>
    );
};

export default Badge;
