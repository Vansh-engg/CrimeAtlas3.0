"use client";

import React from "react";

interface RedButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

export default function RedButton({ text, onClick, className = "" }: RedButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full shadow-[0_0_30px_-5px_#dc2626] transition-all hover:scale-105 active:scale-95 duration-300 ${className}`}
    >
      {text}
    </button>
  );
}
