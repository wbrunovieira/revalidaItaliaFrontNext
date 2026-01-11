#!/usr/bin/env node
/**
 * Script to extract only skeleton meshes from the complete anatomy model
 * Creates an optimized GLB file with only bone meshes
 */

import { NodeIO } from '@gltf-transform/core';
import { prune, dedup, quantize, reorder, meshopt } from '@gltf-transform/functions';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { MeshoptEncoder } from 'meshoptimizer';

// Skeleton mesh names to keep (everything else will be removed)
const SKELETON_MESHES = [
  // Skull and Head
  'skull',
  'jaw_bone',
  'upper_teeth',
  'lover_teeth',
  'hyoid_bone',
  'hyoid_bone_skeletal',

  // Spine
  'cervical_spine',
  'thoracic_spine',
  'lumbar_spine',
  'sacrum',
  'coccyx',
  'intervertebral_disks',

  // Thorax
  'thorax',
  'sternum',
  'costal_cartilage',

  // Pelvis
  'ilium',
  'pubic_symphysis',

  // Left Upper Limb
  'L_clavicle',
  'L_scapula',
  'L_humerus',
  'L_radius',
  'L_ulna',
  'L_wrist',
  'L_metacarpal_bones',
  'L_finger_bones',

  // Right Upper Limb
  'R_clavicle',
  'R_scapula',
  'R_humerus',
  'R_radius',
  'R_ulna',
  'R_wrist',
  'R_metacarpal_bones',
  'R_finger_bones',

  // Left Lower Limb
  'L_femur',
  'L_patella',
  'L_tibia',
  'L_fibula',
  'L_talus',
  'L_calcaneum',
  'L_tarsal_bones',
  'L_metatarsal_bones',
  'L_phalanges',

  // Right Lower Limb
  'R_femur',
  'R_patella',
  'R_tibia',
  'R_fibula',
  'R_talus',
  'R_calcaneum',
  'R_tarsal_bones',
  'R_metatarsal_bones',
  'R_phalanges',
];

async function main() {
  console.log('🦴 Extracting skeleton from anatomy model...\n');

  // Wait for meshopt encoder
  await MeshoptEncoder.ready;

  // Initialize IO with Draco and Meshopt support
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'meshopt.encoder': MeshoptEncoder,
    });

  // Read the complete model (GLB with embedded resources)
  const inputPath = '/Users/brunovieira/Downloads/male_full_anatomy_low_poly.glb';
  const outputPath = './public/models/skeleton/skeleton-bones.glb';

  console.log(`📂 Reading: ${inputPath}`);
  const document = await io.read(inputPath);

  // Get all nodes and filter
  const root = document.getRoot();
  const allNodes = root.listNodes();
  const allMeshes = root.listMeshes();

  console.log(`📊 Found ${allNodes.length} nodes and ${allMeshes.length} meshes`);

  // Track what we're keeping and removing
  let kept = 0;
  let removed = 0;

  // Remove non-skeleton meshes from nodes
  for (const node of allNodes) {
    const mesh = node.getMesh();
    if (mesh) {
      const meshName = mesh.getName() || node.getName();

      if (!SKELETON_MESHES.includes(meshName)) {
        // Remove the mesh from this node
        node.setMesh(null);
        removed++;
      } else {
        kept++;
        console.log(`  ✅ Keeping: ${meshName}`);
      }
    }
  }

  console.log(`\n📊 Kept ${kept} skeleton meshes, removed ${removed} other meshes`);

  // Remove all textures (we apply our own bone material in code)
  console.log('\n🗑️  Removing textures (bone material applied in code)...');
  const textures = root.listTextures();
  console.log(`   Removing ${textures.length} textures...`);
  textures.forEach(t => t.dispose());

  // Apply optimizations
  console.log('\n⚡ Applying optimizations (meshopt compression)...');

  // Remove unused resources and apply heavy compression
  await document.transform(
    prune(),
    dedup(),
    reorder({ encoder: MeshoptEncoder }),
    quantize(),
    meshopt({ encoder: MeshoptEncoder })
  );

  // Write optimized model
  console.log(`\n💾 Writing: ${outputPath}`);
  await io.write(outputPath, document);

  console.log('\n✨ Done! Skeleton model extracted successfully.');
}

main().catch(console.error);
