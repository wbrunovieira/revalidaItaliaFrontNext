'use client';

import { Text } from '@react-three/drei';

// Game mode type
type GameMode = 'study' | 'challenge' | 'consultation' | 'scrivi';

interface InstructionsChalkboardProps {
  gameMode?: GameMode;
}

// Chalkboard with instructions for each game mode
export function InstructionsChalkboard({ gameMode = 'study' }: InstructionsChalkboardProps) {
  const primaryDark = '#0F2940';
  const secondaryColor = '#3887A6';

  return (
    <group position={[-3, 2.5, -4.9]}>
      {/* Chalkboard frame - secondary color */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 3.2, 0.1]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.8} />
      </mesh>

      {/* Chalkboard surface - primary dark */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[4.7, 2.9]} />
        <meshStandardMaterial color={primaryDark} roughness={0.95} />
      </mesh>

      {/* Chalk tray */}
      <mesh position={[0, -1.5, 0.15]}>
        <boxGeometry args={[4.2, 0.08, 0.15]} />
        <meshStandardMaterial color="#0C3559" roughness={0.8} />
      </mesh>

      {gameMode === 'challenge' ? (
        <>
          {/* Challenge Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'🎯 Modalità Trova'}
            <meshBasicMaterial color="#FFD700" />
          </Text>

          {/* Challenge Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Leggi il nome della parte in alto
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Trova e clicca sul punto corretto
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Instruction 3 */}
          <Text
            position={[-2.1, -0.25, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            3. Completa tutte le 43 parti per vincere!
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Instruction 4 */}
          <Text
            position={[-2.1, -0.6, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            4. Attenzione: se sbagli, ricominci da zero!
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Closing message */}
          <Text
            position={[0, -1.1, 0.07]}
            fontSize={0.16}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'💪 Sei pronto? Buona fortuna! 💪'}
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      ) : gameMode === 'consultation' ? (
        <>
          {/* Consultation Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#87CEEB"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'🎧 Modalità Ascolta'}
            <meshBasicMaterial color="#87CEEB" />
          </Text>

          {/* Consultation Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Ascolta il paziente che parla
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Consultation Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Identifica la parte del corpo
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Consultation Instruction 3 */}
          <Text
            position={[-2.1, -0.4, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            3. Clicca sul punto corretto
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Consultation Closing message */}
          <Text
            position={[0, -1.0, 0.07]}
            fontSize={0.16}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'🏥 Diventa un ottimo medico! 🏥'}
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      ) : gameMode === 'scrivi' ? (
        <>
          {/* Scrivi Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#FF9F43"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'✏️ Modalità Scrivi'}
            <meshBasicMaterial color="#FF9F43" />
          </Text>

          {/* Scrivi Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Osserva la parte del corpo evidenziata
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Scrivi Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Scrivi il nome in italiano
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Scrivi Instruction 3 */}
          <Text
            position={[-2.1, -0.4, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            3. Premi Invio per confermare
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Scrivi Closing message */}
          <Text
            position={[0, -1.0, 0.07]}
            fontSize={0.16}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'📝 Impara a scrivere correttamente! 📝'}
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      ) : (
        <>
          {/* Study Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#F5F5DC"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            Come studiare
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Study Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Scegli la parte del corpo nel pannello
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Study Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Passa il mouse sui punti per vedere il nome
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Study Instruction 3 */}
          <Text
            position={[-2.1, -0.4, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            {"3. Clicca per ascoltare l'audio"}
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Study Closing message */}
          <Text
            position={[0, -1.0, 0.07]}
            fontSize={0.18}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            {'❤️ Divertiti e impara! ❤️'}
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      )}
    </group>
  );
}
