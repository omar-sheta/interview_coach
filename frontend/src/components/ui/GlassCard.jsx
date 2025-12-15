import { motion } from 'framer-motion';

/**
 * GlassCard - A glassmorphism card component with blur effect
 */
export const GlassCard = ({
    children,
    className = '',
    hover = true,
    glow = false,
    ...props
}) => {
    return (
        <motion.div
            className={`
        glass-card p-6
        ${glow ? 'animate-glow border-primary-blue/50' : ''}
        ${className}
      `}
            whileHover={hover ? { scale: 1.01, y: -2 } : {}}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
