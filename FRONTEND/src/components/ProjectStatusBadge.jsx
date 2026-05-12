import { formatProjectStatus, getProjectStatusTone } from '../utils/projectStatus';
import './ProjectStatusBadge.css';

const ProjectStatusBadge = ({ status, className = '' }) => {
  const tone = getProjectStatusTone(status);
  const classes = ['project-status-badge', tone, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {formatProjectStatus(status)}
    </span>
  );
};

export default ProjectStatusBadge;
