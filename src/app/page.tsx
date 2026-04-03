"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RedButton from "@/components/RedButton";
import Feature from "@/components/Feature";
import CitySlider from "@/components/CitySlider";

export default function Home() {
  const router = useRouter();

  const scrollTo = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <div className="w-full bg-black pt-20 pb-4 px-6 sm:px-12 lg:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-extrabold leading-tight">
          <span className="text-white">Crime</span>
          <span className="text-red-600">Atlas</span>
        </h1>

        <p className="text-stone-300 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mt-6">
          Harness the power of AI to predict, prevent, and analyze criminal
          activities with real-time insights.
        </p>

        <div className="mt-10 flex justify-center">
          <RedButton
            text="Explore Features"
            onClick={() => scrollTo("features")}
          />
        </div>
      </div>

      {/* CITY SLIDER */}
      <CitySlider
        cities={[
          "Mumbai",
          "Delhi",
          "Bengaluru",
          "Hyderabad",
          "Chennai",
          "Kolkata",
          "Pune",
          "Ahmedabad",
          "Jaipur",
          "Lucknow",
        ]}
      />

      {/* FEATURES */}
      <section
        id="features"
        className="px-6 sm:px-10 lg:px-20 py-24 space-y-24"
      >
        {/* DASHBOARD */}
        <Feature
          id="dashboard"
          badge="Real-time analytics"
          title="Interactive Crime Dashboard"
          description1="A configurable analytics hub with charts, filters, and drill-downs."
          description2="Use the dashboard to create custom date ranges and export reports."
          primaryBtnText="Open Dashboard"
          secondaryBtnText="View Map"
          onPrimaryClick={() => router.push("/dashboard")}
          onSecondaryClick={() => scrollTo("map")}
          image="/dashboard.png"
        />

        {/* MAP */}
        <Feature
          id="map"
          badge="Geospatial Intelligence"
          title="Interactive Crime Map Visualization"
          description1="Explore crime distribution across districts using an interactive map."
          description2="Analyze hotspots and geographical crime risk patterns."
          primaryBtnText="Open Crime Map"
          secondaryBtnText="View Prediction"
          onPrimaryClick={() => router.push("/map")}
          onSecondaryClick={() => scrollTo("prediction")}
          image="/map.png"
          reversed={true}
        />

        {/* PREDICTION */}
        <Feature
          id="prediction"
          badge="AI-Powered Forecasting"
          title="Crime Prediction & Risk Analysis"
          description1="Use machine learning models to forecast crime trends."
          description2="Generate predictive risk scores and simulate scenarios."
          primaryBtnText="Run Prediction"
          secondaryBtnText="Nearby Police Stations"
          onPrimaryClick={() => router.push("/predict")}
          onSecondaryClick={() => scrollTo("police")}
          image="/prediction.png"
        />

        {/* POLICE */}
        <Feature
          id="police"
          badge="Safety Assistance"
          title="Nearby Police Station Locator"
          description1="Quickly find the nearest police stations based on your location."
          description2="View station details, contact numbers, and directions instantly."
          primaryBtnText="Find Police Stations"
          secondaryBtnText="Back to Dashboard"
          onPrimaryClick={() => router.push("/police")}
          onSecondaryClick={() => scrollTo("dashboard")}
          image="/police.png"
          reversed={true}
        />
      </section>
    </>
  );
}
