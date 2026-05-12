const CAPACITY_META = {
  AVAILABLE: { label: 'Available', icon: '●', className: 'badge-avail' },
  FULL_CAPACITY: { label: 'Full Capacity', icon: '●', className: 'badge-full' },
  OVERLOADED: { label: 'Overloaded', icon: '●', className: 'badge-over' },
};

export const normalizeSupervisorCapacity = (status) => String(status || 'AVAILABLE').toUpperCase();

export const getSupervisorCapacityMeta = (status) => CAPACITY_META[normalizeSupervisorCapacity(status)] ?? CAPACITY_META.AVAILABLE;

export const getSupervisorCapacityLabel = (status) => getSupervisorCapacityMeta(status).label;
