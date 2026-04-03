"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface FeatureProps {
  id: string;
  badge: string;
  title: string;
  description1: string;
  description2: string;
  primaryBtnText: string;
  secondaryBtnText: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  image: string;
  reversed?: boolean;
}

export default function Feature({
  id,
  badge,
  title,
  description1,
  description2,
  primaryBtnText,
  secondaryBtnText,
  onPrimaryClick,
  onSecondaryClick,
  image,
  reversed = false,
}: FeatureProps) {
  const content = (
    <div className="flex-1 space-y-4">
      <span className="inline-block px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold border border-red-500/30">
        {badge}
      </span>
      <h2 className="text-4xl md:text-5xl font-bold text-white">{title}</h2>
      <div className="space-y-2 text-white/70">
        <p>{description1}</p>
        <p>{description2}</p>
      </div>
      <div className="flex flex-wrap gap-3 pt-4">
        {onPrimaryClick ? (
          <button
            onClick={onPrimaryClick}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            {primaryBtnText}
          </button>
        ) : (
          <Link
            href={primaryBtnText.toLowerCase().replace(/\s+/g, "")}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            {primaryBtnText}
          </Link>
        )}
        <button
          onClick={onSecondaryClick}
          className="px-6 py-3 glass-panel text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
        >
          {secondaryBtnText}
        </button>
      </div>
    </div>
  );

  const imageElement = (
    <div className="flex-1 relative h-96 md:h-full min-h-80">
      <div className="relative w-full h-full rounded-2xl overflow-hidden glass-panel bg-linear-to-br from-red-600/20 to-black">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-500"
          priority
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      id={id}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center py-12"
    >
      {reversed ? (
        <>
          {imageElement}
          {content}
        </>
      ) : (
        <>
          {content}
          {imageElement}
        </>
      )}
    </div>
  );
}
