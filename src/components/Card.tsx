'use client';

import Image from 'next/image';
import React from 'react';

interface CardProps {
  name: string;
  imageUrl: string;
}

export default function Card({
  name,
  imageUrl,
}: CardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg transition-transform transform hover:scale-[1.025] duration-300 ease-in-out hover:shadow-2xl">
      <div className="relative h-64 w-full">
        <Image src={imageUrl} alt={name} fill />
      </div>
      <div className="bg-primary p-4 text-center transition-colors  group-hover:bg-secondary duration-700 ease-in-out">
        <h3 className="text-3xl font-semibold text-foreground font-sans">
          {name}
        </h3>
      </div>
    </div>
  );
}
