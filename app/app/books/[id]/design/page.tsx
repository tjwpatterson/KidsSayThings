import dynamic from "next/dynamic"

// Force client-side only rendering - no SSR at all
const BookDesignPageClient = dynamic(
  () => import("@/components/app/book-design-page-client"),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    ),
  }
)

export default function BookDesignPage() {
  return <BookDesignPageClient />
}
