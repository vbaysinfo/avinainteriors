import { Suspense } from "react";
import { LoginScreen } from "@/components/platform/LoginScreen";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
