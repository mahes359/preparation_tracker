// src/components/common/Spinner.jsx

const Spinner = ({ size = '', text = '' }) => (
  <div className="loading-center">
    <div className={`spinner ${size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''}`} />
    {text && <p className="text-sm text-muted">{text}</p>}
  </div>
);

export default Spinner;
