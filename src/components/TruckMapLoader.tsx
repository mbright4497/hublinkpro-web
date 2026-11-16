"use client";
import dynamic from "next/dynamic";
import type { MapTruck } from "./TruckMap";

const TruckMap = dynamic(() => import("./TruckMap"), {
  ssr: false,
  loading: () => <div className="truckmap" aria-hidden="true" />,
});

export default function TruckMapLoader(props: { trucks: MapTruck[]; center: [number, number] }) {
  return <TruckMap {...props} />;
}
