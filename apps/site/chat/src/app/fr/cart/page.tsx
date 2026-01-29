"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { ShoppingCartPage } from "@/components/cart/cart";

export default function CartPage() {
  return (
    <MainLayout>
      <ShoppingCartPage />
    </MainLayout>
  );
}

