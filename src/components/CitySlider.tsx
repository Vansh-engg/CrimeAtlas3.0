"use client";

import React from "react";

interface CitySliderProps {
  cities: string[];
}

const CitySlider: React.FC<CitySliderProps> = ({ cities }) => {
  const duplicatedCities = [...cities, ...cities];

  return (
    <section className="px-6 sm:px-12 lg:px-20 py-20">
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
        Cities Covered
      </h2>

      <div className="flex justify-center">
        <div className="relative w-full max-w-5xl overflow-hidden">

          {/* Strong Center Glow */}
          <div className="absolute inset-0 flex justify-center pointer-events-none z-10">
            <div className="w-40 h-full bg-linear-to-r from-transparent via-red-900/20 to-transparent blur-2xl"></div>
          </div>

          {/* Left Fade */}
          <div className="absolute left-0 top-0 w-28 h-full bg-linear-to-r from-black via-black to-transparent z-20 pointer-events-none"></div>

          {/* Right Fade */}
          <div className="absolute right-0 top-0 w-28 h-full bg-linear-to-l from-black via-black to-transparent z-20 pointer-events-none"></div>

          {/* Animated Slider Track */}
          <div className="slider-track flex whitespace-nowrap items-center animate-slide">

            {duplicatedCities.map((city, index) => (
              <div
                key={index}
                className="
                  mx-8
                  px-6 py-2
                  rounded-xl
                  bg-white/5
                  border border-red-500/20
                  text-white font-medium
                  text-sm sm:text-base
                  transition-all duration-500
                  hover:bg-red-600 hover:text-white
                "
              >
                {city}
              </div>
            ))}

          </div>

        </div>
      </div>
    </section>
  );
};

export default CitySlider;