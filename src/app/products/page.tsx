// app/products/page.tsx
import { Suspense } from "react";
import ProductsPageClient from "./ProductsPageClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPageClient />
    </Suspense>
  );
}
