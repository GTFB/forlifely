"use client";

import { MainLayout } from "@/components/layouts/main-layout";
import { CheckoutPage } from "@/components/checkout/checkout";

export default function CheckoutPageRoute() {
  return (
    <MainLayout>
      <CheckoutPage />
    </MainLayout>
  );
}

