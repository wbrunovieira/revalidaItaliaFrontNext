// src/components/TextField.tsx
import React from 'react';

type Props = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
};

export default function TextField({
  label,
  name,
  type = 'text',
  placeholder,
}: Props) {
  return (
    <label className="block text-white">
      <span className="text-sm">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-1 block w-full rounded bg-white px-3 py-2 text-gray-700 focus:outline-none"
      />
    </label>
  );
}
