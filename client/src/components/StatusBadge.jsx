import Badge from './ui/Badge.jsx';
import { ITEM_STATUS, CLAIM_STATUS } from '../constants/enums.js';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const statusMap = {
    // Item status
    [ITEM_STATUS.ACTIVE]: { variant: 'green', label: 'Active' },
    [ITEM_STATUS.CLAIMED]: { variant: 'amber', label: 'Claimed' },
    [ITEM_STATUS.RESOLVED]: { variant: 'blue', label: 'Resolved' },
    [ITEM_STATUS.CLOSED]: { variant: 'slate', label: 'Closed' },

    // Claim status
    [CLAIM_STATUS.PENDING]: { variant: 'amber', label: 'Pending' },
    [CLAIM_STATUS.APPROVED]: { variant: 'green', label: 'Approved' },
    [CLAIM_STATUS.REJECTED]: { variant: 'red', label: 'Rejected' },
    [CLAIM_STATUS.WITHDRAWN]: { variant: 'slate', label: 'Withdrawn' },
  };

  const config = statusMap[status] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {config.label}
    </Badge>
  );
}
