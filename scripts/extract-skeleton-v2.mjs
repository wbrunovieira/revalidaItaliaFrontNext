#!/usr/bin/env node
/**
 * Script to extract only skeleton meshes from the internal anatomy model
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

// Skeleton mesh names to keep
const SKELETON_MESHES = new Set([
  'skull', 'jaw_bone', 'upper_teeth', 'lover_teeth', 'hyoid_bone', 'hyoid_bone_skeletal',
  'cervical_spine', 'thoracic_spine', 'lumbar_spine', 'sacrum', 'coccyx', 'intervertebral_disks',
  'thorax', 'sternum', 'costal_cartilage',
  'ilium', 'pubic_symphysis',
  'L_clavicle', 'L_scapula', 'L_humerus', 'L_radius', 'L_ulna', 'L_wrist', 'L_metacarpal_bones', 'L_finger_bones',
  'R_clavicle', 'R_scapula', 'R_humerus', 'R_radius', 'R_ulna', 'R_wrist', 'R_metacarpal_bones', 'R_finger_bones',
  'L_femur', 'L_patella', 'L_tibia', 'L_fibula', 'L_talus', 'L_calcaneum', 'L_tarsal_bones', 'L_metatarsal_bones', 'L_phalanges',
  'R_femur', 'R_patella', 'R_tibia', 'R_fibula', 'R_talus', 'R_calcaneum', 'R_tarsal_bones', 'R_metatarsal_bones', 'R_phalanges',
]);

async function main() {
  console.log('🦴 Extracting skeleton from anatomy model...\n');

  // Wait for meshopt to be ready
  await MeshoptDecoder.ready;
  await MeshoptEncoder.ready;

  // Initialize IO with all extensions
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  const inputPath = './public/models/human-body/anatomy-internal.glb';
  const outputPath = './public/models/skeleton/skeleton-bones.glb';

  console.log(`📂 Reading: ${inputPath}`);
  const document = await io.read(inputPath);

  const root = document.getRoot();
  const allMeshes = root.listMeshes();
  const allNodes = root.listNodes();

  console.log(`📊 Found ${allMeshes.length} meshes, ${allNodes.length} nodes`);

  // Track stats
  let kept = 0;
  let removed = 0;

  // Remove non-skeleton meshes
  for (const mesh of allMeshes) {
    const meshName = mesh.getName();

    if (!SKELETON_MESHES.has(meshName)) {
      // Find and disconnect nodes using this mesh
      for (const node of allNodes) {
        if (node.getMesh() === mesh) {
          node.setMesh(null);
        }
      }
      removed++;
    } else {
      kept++;
      console.log(`  ✅ Keeping: ${meshName}`);
    }
  }

  console.log(`\n📊 Kept ${kept} skeleton meshes, marked ${removed} for removal`);

  // Clean up unused resources
  console.log('\n⚡ Cleaning up unused resources...');
  await document.transform(
    prune(),
    dedup()
  );

  // Write output
  console.log(`\n💾 Writing: ${outputPath}`);
  await io.write(outputPath, document);

  // Get file size
  const fs = await import('fs');
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`\n✨ Done! Size: ${sizeKB} KB`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
