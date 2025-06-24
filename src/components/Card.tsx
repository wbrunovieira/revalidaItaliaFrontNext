// src/components/Card.tsx
import Image from 'next/image';
import Link from 'next/link';

interface CardProps {
  name: string;
  imageUrl: string;
  href?: string;
}

export default function Card({
  name,
  imageUrl,
  href,
}: CardProps) {
  const cardContent = (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {name}
        </h3>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
