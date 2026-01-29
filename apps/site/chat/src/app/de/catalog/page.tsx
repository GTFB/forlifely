import { Suspense } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { ProductListingPage } from "@/components/catalog/list";

export default function CatalogPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
        <ProductListingPage />
      </Suspense>
    </MainLayout>
  );
}

