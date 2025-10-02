// app/products/page.tsx
import { Suspense } from "react";
import ProductsPageClient from "./ProductsPageClient";

export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPageClient searchParams={searchParams} />
    </Suspense>
  );
}