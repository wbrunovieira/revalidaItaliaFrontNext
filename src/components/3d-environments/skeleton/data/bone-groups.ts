import type { BoneHotspot } from '../types';
import { BONE_HOTSPOTS } from './bone-hotspots';

// Group hotspots by body region for UI organization

// CRANIO (Skull region)
export const SKULL_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['cranio', 'frontale', 'parietale', 'temporale', 'occipitale', 'mandibola'].includes(h.id)
);

// COLONNA VERTEBRALE (Spine region)
export const SPINE_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['vertebre-cervicali', 'vertebre-toraciche', 'vertebre-lombari', 'sacro', 'coccige'].includes(h.id)
);

// GABBIA TORACICA (Rib cage region)
export const RIBCAGE_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['sterno', 'costole', 'clavicola', 'scapola'].includes(h.id)
);

// BACINO (Pelvis region)
export const PELVIS_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['osso-iliaco', 'ischio', 'pube'].includes(h.id)
);

// ARTO SUPERIORE (Upper limb)
export const UPPER_LIMB_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['omero', 'radio', 'ulna', 'carpo', 'metacarpo', 'falangi-mano'].includes(h.id)
);

// ARTO INFERIORE (Lower limb)
export const LOWER_LIMB_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['femore', 'rotula', 'tibia', 'perone', 'tarso', 'metatarso', 'falangi-piede'].includes(h.id)
);

// ARTICOLAZIONI (Joints)
export const JOINTS_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['gomito', 'polso', 'anca', 'ginocchio', 'caviglia'].includes(h.id)
);
