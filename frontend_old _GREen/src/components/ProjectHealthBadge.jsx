import { getProjectHealthMeta } from '../utils/projectHealth';
import './ProjectHealthBadge.css';

const ProjectHealthBadge = ({ health, reason = '', className = '' }) => {
  const meta = getProjectHealthMeta(health);
  const classes = ['project-health-badge', meta.className, className].filter(Boolean).join(' ');

  return (
    <span className={classes} title={reason || meta.label}>
      <span className="project-health-badge__icon" aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
};

export default ProjectHealthBadge;
