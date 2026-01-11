#!/usr/bin/env node
/**
 * Script to extract only skeleton meshes from the complete anatomy model
 * Uses Three.js GLTFLoader and GLTFExporter
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Polyfill for Node.js
import { Blob } from 'buffer';
global.Blob = Blob;

// Use dynamic imports for Three.js
const THREE = await import('three');
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Skeleton mesh names to keep
const SKELETON_MESHES = [
  'skull', 'jaw_bone', 'upper_teeth', 'lover_teeth', 'hyoid_bone', 'hyoid_bone_skeletal',
  'cervical_spine', 'thoracic_spine', 'lumbar_spine', 'sacrum', 'coccyx', 'intervertebral_disks',
  'thorax', 'sternum', 'costal_cartilage',
  'ilium', 'pubic_symphysis',
  'L_clavicle', 'L_scapula', 'L_humerus', 'L_radius', 'L_ulna', 'L_wrist', 'L_metacarpal_bones', 'L_finger_bones',
  'R_clavicle', 'R_scapula', 'R_humerus', 'R_radius', 'R_ulna', 'R_wrist', 'R_metacarpal_bones', 'R_finger_bones',
  'L_femur', 'L_patella', 'L_tibia', 'L_fibula', 'L_talus', 'L_calcaneum', 'L_tarsal_bones', 'L_metatarsal_bones', 'L_phalanges',
  'R_femur', 'R_patella', 'R_tibia', 'R_fibula', 'R_talus', 'R_calcaneum', 'R_tarsal_bones', 'R_metatarsal_bones', 'R_phalanges',
];

async function main() {
  console.log('🦴 Extracting skeleton meshes...\n');

  const inputPath = path.join(__dirname, '../public/models/human-body/anatomy-internal.glb');
  const outputPath = path.join(__dirname, '../public/models/skeleton/skeleton-bones.glb');

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Read the GLB file as buffer
  const buffer = fs.readFileSync(inputPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  // Setup loader
  const loader = new GLTFLoader();

  // Parse the GLB
  console.log('📂 Loading model...');

  const gltf = await new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', resolve, reject);
  });

  console.log(`✅ Model loaded`);

  const scene = gltf.scene;

  // Collect meshes to keep and remove
  const meshesToRemove = [];
  const meshesKept = [];

  scene.traverse((child) => {
    if (child.isMesh) {
      const meshName = child.name;
      if (SKELETON_MESHES.includes(meshName)) {
        meshesKept.push(meshName);
        console.log(`  ✅ Keeping: ${meshName}`);
      } else {
        meshesToRemove.push(child);
      }
    }
  });

  // Remove non-skeleton meshes
  console.log(`\n🗑️  Removing ${meshesToRemove.length} non-skeleton meshes...`);
  meshesToRemove.forEach(mesh => {
    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }
    // Dispose geometry and material
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });

  console.log(`\n📊 Kept ${meshesKept.length} skeleton meshes`);

  // Export the filtered scene
  console.log('\n💾 Exporting filtered model...');

  const exporter = new GLTFExporter();

  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result),
      reject,
      { binary: true }
    );
  });

  // Write the output file
  fs.writeFileSync(outputPath, Buffer.from(glbBuffer));

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`\n✨ Done! Created: ${outputPath}`);
  console.log(`📦 Size: ${sizeKB} KB`);
}

main().catch(console.error);
