import { useNavigate, useLocation } from "react-router-dom";
import "./PageHeader.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

function PageHeader({ title, subtitle }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Si se ha entrado directamente en la página, volvemos al grafo.
    if (location.key === "default") {
      navigate("/grafo");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-header">
      <button
        type="button"
        className="page-header-back"
        onClick={handleBack}
        aria-label="Volver a la página anterior"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>

        <span>Volver</span>
      </button>

      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

export default PageHeader;