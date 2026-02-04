export const Logo = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="32" height="32" rx="8" className="fill-primary" />
        {/* Diamond shape */}
        <path 
            d="M16 6L26 16L16 26L6 16L16 6Z" 
            className="fill-primary-foreground" 
        />
        {/* Inner accent */}
        <path 
            d="M16 10L22 16L16 22L10 16L16 10Z" 
            className="fill-primary" 
            opacity="0.3"
        />
    </svg>
);
