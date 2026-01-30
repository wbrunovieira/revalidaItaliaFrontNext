import type { BoneHotspot } from '../types';
import { BONE_HOTSPOTS } from './bone-hotspots';

// Group hotspots by body region for UI organization

// CRANIO (Skull region)
export const SKULL_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['cranio', 'frontale', 'parietale', 'temporale', 'zigomatico', 'occipitale', 'mandibola', 'atlante', 'epistrofeo', 'clavicola'].includes(h.id)
);

// COLONNA VERTEBRALE (Spine region)
export const SPINE_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['colonna-vertebrale', 'vertebre-cervicali', 'vertebre-toraciche', 'vertebre-lombari', 'sacro', 'coccige', 'scapola', 'spina-della-scapola', 'acromion'].includes(h.id)
);

// GABBIA TORACICA (Rib cage region)
export const RIBCAGE_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['sterno', 'costole', 'costola-fluttuante'].includes(h.id)
);

// BACINO (Pelvis region)
export const PELVIS_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['ileo', 'ischio'].includes(h.id)
);

// ARTO SUPERIORE (Upper limb)
export const UPPER_LIMB_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['omero', 'testa-dell-omero', 'epicondilo', 'epitroclea', 'radio', 'ulna', 'olecrano', 'carpo', 'metacarpo'].includes(h.id)
);

// ARTO INFERIORE (Lower limb)
export const LOWER_LIMB_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['femore', 'grande-trocantere', 'collo-del-femore', 'testa-del-femore', 'condilo-mediale-femore', 'condilo-laterale-femore', 'rotula', 'tibia', 'perone', 'astragalo', 'calcagno', 'tarso', 'metatarso', 'falangi-piede', 'prima-falange', 'seconda-falange'].includes(h.id)
);

// ARTICOLAZIONI (Joints)
export const JOINTS_HOTSPOTS: BoneHotspot[] = BONE_HOTSPOTS.filter(h =>
  ['caviglia'].includes(h.id)
);
