// src/components/common/Badge.jsx

const Badge = ({ children, variant = 'purple' }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

export default Badge;
