import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const S: React.FC<{ size?: number; className?: string; children: React.ReactNode }> = ({
  size = 24,
  className,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);

export const OpenFcadLogoIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="ofcadLogoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="5" fill="url(#ofcadLogoGrad)" />
    <path d="M8.5 7h15v4.6H13.5v4.5h8v4.5h-8V26H8.5V7z" fill="#FFFFFF" />
    <circle cx="24" cy="23.5" r="2.6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.1" />
  </svg>
);

// DRAW ICONS
export const LineIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="4" y1="20" x2="20" y2="4" stroke="#E2EAF4" strokeWidth="1.8" />
    <rect x="2.5" y="18.5" width="3.5" height="3.5" fill="#38ABDF" stroke="#38ABDF" strokeWidth="1" />
    <rect x="18" y="2.5" width="3.5" height="3.5" fill="#38ABDF" stroke="#38ABDF" strokeWidth="1" />
  </S>
);

export const PolylineIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polyline points="3,19 9,7 16,15 21,5" stroke="#E2EAF4" strokeWidth="1.8" />
    <rect x="1.8" y="17.8" width="2.8" height="2.8" fill="#38ABDF" stroke="none" />
    <rect x="7.6" y="5.6" width="2.8" height="2.8" fill="#38ABDF" stroke="none" />
    <rect x="14.6" y="13.6" width="2.8" height="2.8" fill="#38ABDF" stroke="none" />
    <rect x="19.6" y="3.6" width="2.8" height="2.8" fill="#38ABDF" stroke="none" />
  </S>
);

export const CircleIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" stroke="#E2EAF4" strokeWidth="1.8" />
    <line x1="12" y1="12" x2="18.5" y2="6.5" stroke="#38ABDF" strokeWidth="1.3" strokeDasharray="2 1.5" />
    <circle cx="12" cy="12" r="2" fill="#38ABDF" stroke="none" />
  </S>
);

export const ArcIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M 4 18 A 12 12 0 0 1 20 6" stroke="#E2EAF4" strokeWidth="1.8" />
    <rect x="2.5" y="16.5" width="3" height="3" fill="#38ABDF" stroke="none" />
    <rect x="8.8" y="8" width="3" height="3" fill="#38ABDF" stroke="none" />
    <rect x="18.5" y="4.5" width="3" height="3" fill="#38ABDF" stroke="none" />
  </S>
);

export const RectIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="4" y="6" width="16" height="12" stroke="#E2EAF4" strokeWidth="1.8" />
    <rect x="2.5" y="4.5" width="3.2" height="3.2" fill="#38ABDF" stroke="none" />
    <rect x="18.3" y="16.3" width="3.2" height="3.2" fill="#38ABDF" stroke="none" />
  </S>
);

export const PolygonIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" stroke="#E2EAF4" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="1.8" fill="#38ABDF" stroke="none" />
  </S>
);

export const EllipseIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-20 12 12)" stroke="#E2EAF4" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="1.8" fill="#38ABDF" stroke="none" />
  </S>
);

export const SplineIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M3 19 C 7 4, 15 20, 21 5" stroke="#E2EAF4" strokeWidth="1.8" />
    <circle cx="3" cy="19" r="1.6" fill="#38ABDF" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="#38ABDF" stroke="none" />
    <circle cx="21" cy="5" r="1.6" fill="#38ABDF" stroke="none" />
  </S>
);

export const HatchIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="16" stroke="#E2EAF4" strokeWidth="1.6" />
    <line x1="4" y1="10" x2="10" y2="4" stroke="#38ABDF" strokeWidth="1.3" />
    <line x1="4" y1="16" x2="16" y2="4" stroke="#38ABDF" strokeWidth="1.3" />
    <line x1="6" y1="20" x2="20" y2="6" stroke="#38ABDF" strokeWidth="1.3" />
    <line x1="12" y1="20" x2="20" y2="12" stroke="#38ABDF" strokeWidth="1.3" />
  </S>
);

export const XLineIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="2" y1="22" x2="22" y2="2" stroke="#38ABDF" strokeWidth="1.5" strokeDasharray="3 2" />
    <polyline points="2,18 2,22 6,22" stroke="#E2EAF4" strokeWidth="1.5" />
    <polyline points="18,2 22,2 22,6" stroke="#E2EAF4" strokeWidth="1.5" />
  </S>
);

export const PointIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" stroke="#38ABDF" strokeWidth="1.6" />
    <line x1="12" y1="4" x2="12" y2="20" stroke="#E2EAF4" strokeWidth="1.4" />
    <line x1="4" y1="12" x2="20" y2="12" stroke="#E2EAF4" strokeWidth="1.4" />
  </S>
);

export const RevCloudIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M6 17a3 3 0 0 1-.5-5.8A4 4 0 0 1 13 7a4 4 0 0 1 6.2 3.2A3 3 0 0 1 18 17H6z" stroke="#38ABDF" strokeWidth="1.7" />
  </S>
);

// MODIFY ICONS
export const MoveIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="12" y1="3" x2="12" y2="21" stroke="#38ABDF" strokeWidth="1.7" />
    <line x1="3" y1="12" x2="21" y2="12" stroke="#38ABDF" strokeWidth="1.7" />
    <polyline points="9,6 12,3 15,6" stroke="#E2EAF4" />
    <polyline points="9,18 12,21 15,18" stroke="#E2EAF4" />
    <polyline points="6,9 3,12 6,15" stroke="#E2EAF4" />
    <polyline points="18,9 21,12 18,15" stroke="#E2EAF4" />
  </S>
);

export const CopyIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="8" cy="16" r="4.5" stroke="#9AA8B8" strokeWidth="1.5" strokeDasharray="2 1.5" />
    <circle cx="16" cy="8" r="4.5" stroke="#38ABDF" strokeWidth="1.8" />
    <line x1="11" y1="13" x2="13.5" y2="10.5" stroke="#E2EAF4" strokeWidth="1.4" />
  </S>
);

export const RotateIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M19.5 11A7.5 7.5 0 1 0 12 19.5" stroke="#38ABDF" strokeWidth="1.8" />
    <polyline points="16.5,11 19.5,11 19.5,8" stroke="#E2EAF4" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2" fill="#E2EAF4" stroke="none" />
  </S>
);

export const MirrorIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polygon points="4,18 9.5,6 9.5,18" stroke="#9AA8B8" strokeWidth="1.5" />
    <line x1="12" y1="3" x2="12" y2="21" stroke="#F5A623" strokeWidth="1.4" strokeDasharray="2.5 2" />
    <polygon points="20,18 14.5,6 14.5,18" stroke="#38ABDF" strokeWidth="1.7" />
  </S>
);

export const ScaleIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="4" y="12" width="8" height="8" stroke="#9AA8B8" strokeWidth="1.4" strokeDasharray="2 1.5" />
    <rect x="4" y="4" width="16" height="16" stroke="#38ABDF" strokeWidth="1.7" />
    <line x1="12" y1="12" x2="18.5" y2="5.5" stroke="#E2EAF4" strokeWidth="1.5" />
    <polyline points="15,5.5 18.5,5.5 18.5,9" stroke="#E2EAF4" strokeWidth="1.5" />
  </S>
);

export const TrimIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="4" y1="20" x2="14" y2="10" stroke="#E2EAF4" strokeWidth="1.8" />
    <line x1="14" y1="10" x2="20" y2="4" stroke="#EF476F" strokeWidth="1.5" strokeDasharray="2 2" />
    <line x1="9" y1="5" x2="19" y2="15" stroke="#38ABDF" strokeWidth="1.8" />
  </S>
);

export const ExtendIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="4" y1="17" x2="12" y2="17" stroke="#E2EAF4" strokeWidth="1.8" />
    <line x1="12" y1="17" x2="19" y2="17" stroke="#38ABDF" strokeWidth="1.7" strokeDasharray="2.5 1.5" />
    <line x1="19" y1="4" x2="19" y2="20" stroke="#F5A623" strokeWidth="1.8" />
  </S>
);

export const FilletIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M4 20 V 11 A 7 7 0 0 1 11 4 H 20" stroke="#E2EAF4" strokeWidth="1.8" />
    <path d="M4 11 A 7 7 0 0 1 11 4" stroke="#38ABDF" strokeWidth="2.2" />
    <polyline points="4,10 4,4 10,4" stroke="#6E7C8E" strokeWidth="1.2" strokeDasharray="2 2" />
  </S>
);

export const ChamferIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polyline points="4,20 4,11 11,4 20,4" stroke="#E2EAF4" strokeWidth="1.8" />
    <line x1="4" y1="11" x2="11" y2="4" stroke="#38ABDF" strokeWidth="2.2" />
    <polyline points="4,10 4,4 10,4" stroke="#6E7C8E" strokeWidth="1.2" strokeDasharray="2 2" />
  </S>
);

export const OffsetIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M4 16 A 12 12 0 0 1 16 4" stroke="#9AA8B8" strokeWidth="1.6" />
    <path d="M8 20 A 12 12 0 0 1 20 8" stroke="#38ABDF" strokeWidth="1.9" />
  </S>
);

export const ArrayIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" stroke="#E2EAF4" strokeWidth="1.5" />
    <rect x="14" y="3.5" width="6.5" height="6.5" stroke="#38ABDF" strokeWidth="1.5" />
    <rect x="3.5" y="14" width="6.5" height="6.5" stroke="#38ABDF" strokeWidth="1.5" />
    <rect x="14" y="14" width="6.5" height="6.5" stroke="#38ABDF" strokeWidth="1.5" />
  </S>
);

export const ExplodeIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polyline points="4,10 4,4 10,4" stroke="#38ABDF" strokeWidth="1.7" />
    <polyline points="14,4 20,4 20,10" stroke="#38ABDF" strokeWidth="1.7" />
    <polyline points="20,14 20,20 14,20" stroke="#38ABDF" strokeWidth="1.7" />
    <polyline points="10,20 4,20 4,14" stroke="#38ABDF" strokeWidth="1.7" />
    <rect x="9.5" y="9.5" width="5" height="5" stroke="#E2EAF4" strokeWidth="1.4" />
  </S>
);

export const JoinIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="3" y1="12" x2="10" y2="12" stroke="#E2EAF4" strokeWidth="1.8" />
    <line x1="14" y1="12" x2="21" y2="12" stroke="#E2EAF4" strokeWidth="1.8" />
    <polyline points="7,8 11,12 7,16" stroke="#38ABDF" strokeWidth="1.6" />
    <polyline points="17,8 13,12 17,16" stroke="#38ABDF" strokeWidth="1.6" />
  </S>
);

export const EraseIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M20 20H8l-5-5 10-10 8 8-7 7" stroke="#E2EAF4" strokeWidth="1.6" />
    <line x1="11" y1="7" x2="19" y2="15" stroke="#EF476F" strokeWidth="1.6" />
  </S>
);

export const StretchIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="4" y="6" width="10" height="12" stroke="#9AA8B8" strokeWidth="1.4" strokeDasharray="2 1.5" />
    <rect x="4" y="6" width="16" height="12" stroke="#38ABDF" strokeWidth="1.7" />
    <line x1="14" y1="12" x2="20" y2="12" stroke="#F5A623" strokeWidth="1.7" />
  </S>
);

// ANNOTATE ICONS
export const TextIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M5 19L12 4l7 15" stroke="#E2EAF4" strokeWidth="1.9" />
    <line x1="7.5" y1="14" x2="16.5" y2="14" stroke="#38ABDF" strokeWidth="1.8" />
  </S>
);

export const DimensionIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <line x1="4" y1="20" x2="4" y2="6" stroke="#9AA8B8" strokeWidth="1.4" />
    <line x1="20" y1="20" x2="20" y2="6" stroke="#9AA8B8" strokeWidth="1.4" />
    <line x1="4" y1="9" x2="20" y2="9" stroke="#38ABDF" strokeWidth="1.7" />
    <polyline points="7,7 4,9 7,11" stroke="#38ABDF" strokeWidth="1.4" />
    <polyline points="17,7 20,9 17,11" stroke="#38ABDF" strokeWidth="1.4" />
    <rect x="9" y="13" width="6" height="4" stroke="#E2EAF4" strokeWidth="1.3" />
  </S>
);

export const LeaderIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polyline points="4,18 11,9 20,9" stroke="#38ABDF" strokeWidth="1.7" />
    <polygon points="4,18 5.5,14 8.2,16.5" fill="#38ABDF" stroke="none" />
    <line x1="14" y1="5" x2="21" y2="5" stroke="#E2EAF4" strokeWidth="1.6" />
  </S>
);

// LAYERS / BLOCKS / PROPERTIES / UTILITIES / 3D
export const LayersIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polygon points="12,3 22,8 12,13 2,8" stroke="#38ABDF" strokeWidth="1.6" fill="#38ABDF28" />
    <polyline points="2,12.5 12,17.5 22,12.5" stroke="#E2EAF4" strokeWidth="1.5" />
    <polyline points="2,16.5 12,21.5 22,16.5" stroke="#9AA8B8" strokeWidth="1.5" />
  </S>
);

export const BlockIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" stroke="#E2EAF4" strokeWidth="1.5" strokeDasharray="3 1.5" />
    <circle cx="10" cy="10" r="3" stroke="#38ABDF" strokeWidth="1.6" />
    <rect x="12.5" y="12.5" width="5" height="5" stroke="#F5A623" strokeWidth="1.5" />
  </S>
);

export const MatchPropIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M18 4l2 2-8 8-3-3 9-7z" stroke="#38ABDF" strokeWidth="1.6" />
    <path d="M9 11c-2 2-4 2.5-5 7 4.5-1 5-3 7-5" stroke="#F5A623" strokeWidth="1.6" />
  </S>
);

export const MeasureIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="3" y="8" width="18" height="8" rx="1" stroke="#F5A623" strokeWidth="1.6" />
    <line x1="7" y1="8" x2="7" y2="12" stroke="#E2EAF4" strokeWidth="1.3" />
    <line x1="12" y1="8" x2="12" y2="13.5" stroke="#E2EAF4" strokeWidth="1.3" />
    <line x1="17" y1="8" x2="17" y2="12" stroke="#E2EAF4" strokeWidth="1.3" />
  </S>
);

export const Box3DIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polygon points="12,3 21,7.5 12,12 3,7.5" stroke="#E2EAF4" fill="#38ABDF33" strokeWidth="1.5" />
    <polygon points="3,7.5 12,12 12,21 3,16.5" stroke="#E2EAF4" fill="#38ABDF1A" strokeWidth="1.5" />
    <polygon points="21,7.5 12,12 12,21 21,16.5" stroke="#38ABDF" fill="#38ABDF44" strokeWidth="1.5" />
  </S>
);

export const Cylinder3DIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <ellipse cx="12" cy="6.5" rx="7" ry="3" stroke="#E2EAF4" fill="#38ABDF33" strokeWidth="1.5" />
    <path d="M5 6.5V17.5C5 19.2 8.1 20.5 12 20.5C15.9 20.5 19 19.2 19 17.5V6.5" stroke="#38ABDF" strokeWidth="1.6" />
  </S>
);

export const Sphere3DIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" stroke="#38ABDF" fill="#38ABDF28" strokeWidth="1.6" />
    <ellipse cx="12" cy="12" rx="8.5" ry="3.2" stroke="#E2EAF4" strokeWidth="1.2" />
    <ellipse cx="12" cy="12" rx="3.2" ry="8.5" stroke="#E2EAF4" strokeWidth="1.2" />
  </S>
);

export const Cone3DIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M12 3L4.5 17.5C4.5 19.4 7.9 20.5 12 20.5C16.1 20.5 19.5 19.4 19.5 17.5L12 3Z" stroke="#38ABDF" fill="#38ABDF28" strokeWidth="1.6" />
    <ellipse cx="12" cy="17.5" rx="7.5" ry="2.6" stroke="#E2EAF4" strokeWidth="1.2" />
  </S>
);

export const Extrude3DIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polygon points="4,16 12,20 20,16 12,12" stroke="#9AA8B8" strokeWidth="1.4" />
    <polygon points="4,9 12,13 20,9 12,5" stroke="#38ABDF" fill="#38ABDF38" strokeWidth="1.6" />
    <line x1="4" y1="9" x2="4" y2="16" stroke="#E2EAF4" strokeWidth="1.4" />
    <line x1="20" y1="9" x2="20" y2="16" stroke="#E2EAF4" strokeWidth="1.4" />
    <line x1="12" y1="13" x2="12" y2="20" stroke="#E2EAF4" strokeWidth="1.4" />
    <line x1="12" y1="2" x2="12" y2="8" stroke="#F5A623" strokeWidth="1.8" />
    <polyline points="9.5,4.5 12,2 14.5,4.5" stroke="#F5A623" strokeWidth="1.6" />
  </S>
);

export const Orbit3DIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" stroke="#46C96E" strokeWidth="1.6" />
    <circle cx="12" cy="3.5" r="1.5" fill="#46C96E" stroke="none" />
    <circle cx="12" cy="20.5" r="1.5" fill="#46C96E" stroke="none" />
    <circle cx="3.5" cy="12" r="1.5" fill="#46C96E" stroke="none" />
    <circle cx="20.5" cy="12" r="1.5" fill="#46C96E" stroke="none" />
    <path d="M8 14l4-4 4 4" stroke="#E2EAF4" strokeWidth="1.5" />
  </S>
);

export const UndoIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M9 14L4 9l5-5" stroke="#E2EAF4" strokeWidth="1.8" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke="#38ABDF" strokeWidth="1.8" />
  </S>
);

export const RedoIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M15 14l5-5-5-5" stroke="#E2EAF4" strokeWidth="1.8" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" stroke="#38ABDF" strokeWidth="1.8" />
  </S>
);

export const SaveIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="#E2EAF4" strokeWidth="1.6" />
    <polyline points="17 21 17 13 7 13 7 21" stroke="#38ABDF" strokeWidth="1.5" />
    <polyline points="7 3 7 8 15 8" stroke="#E2EAF4" strokeWidth="1.5" />
  </S>
);

export const PrintIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polyline points="6 9 6 3 18 3 18 9" stroke="#E2EAF4" strokeWidth="1.6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="#38ABDF" strokeWidth="1.6" />
    <rect x="6" y="14" width="12" height="7" stroke="#E2EAF4" strokeWidth="1.5" />
  </S>
);

export const NewFileIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#E2EAF4" strokeWidth="1.6" />
    <polyline points="14 2 14 8 20 8" stroke="#38ABDF" strokeWidth="1.6" />
  </S>
);

export const OpenFolderIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#F5A623" strokeWidth="1.6" fill="#F5A62322" />
  </S>
);

export const ZoomExtentsIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" stroke="#38ABDF" strokeWidth="1.7" />
    <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#E2EAF4" strokeWidth="1.8" />
    <polyline points="8,8 14,8 14,14 8,14 8,8" stroke="#E2EAF4" strokeWidth="1.3" />
  </S>
);

export const PanIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <path d="M18 11V6a2 2 0 0 0-4 0v4M14 10V4a2 2 0 0 0-4 0v6M10 10V6a2 2 0 0 0-4 0v8l-1.5-1.5a2 2 0 0 0-2.8 2.8l5.3 5.7h9a3 3 0 0 0 3-3v-7a2 2 0 0 0-4 0" stroke="#E2EAF4" strokeWidth="1.5" />
  </S>
);

export const GridStatusIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="1.4" />
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1.2" />
    <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="1.2" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.2" />
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1.2" />
  </S>
);

export const OrthoStatusIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <polyline points="5,4 5,19 20,19" stroke="currentColor" strokeWidth="2" />
    <polyline points="5,13 11,13 11,19" stroke="currentColor" strokeWidth="1.4" />
  </S>
);

export const PolarStatusIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="12" x2="18.5" y2="6.5" stroke="currentColor" strokeWidth="1.8" />
    <line x1="12" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.4" />
  </S>
);

export const OsnapStatusIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14" y="2" width="6" height="6" fill="#39FF14" stroke="#111" strokeWidth="1" />
  </S>
);

export const PropertiesIcon: React.FC<IconProps> = (p) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" stroke="#E2EAF4" strokeWidth="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="#38ABDF" strokeWidth="1.5" />
    <line x1="10" y1="9" x2="10" y2="20" stroke="#9AA8B8" strokeWidth="1.2" />
    <line x1="6" y1="13" x2="18" y2="13" stroke="#9AA8B8" strokeWidth="1.2" />
    <line x1="6" y1="16.5" x2="18" y2="16.5" stroke="#9AA8B8" strokeWidth="1.2" />
  </S>
);
