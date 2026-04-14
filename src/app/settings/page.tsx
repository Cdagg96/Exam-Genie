import { Suspense } from "react";
import SettingsClient from "./SettingsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsClient />
    </Suspense>
  );
}