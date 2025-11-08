import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/app")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-serif font-bold">SaySo</h1>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-serif font-bold mb-4 md:text-6xl">
            Capture Every Quote
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Preserve the funny, sweet, and memorable things your family says.
            Organize them by person and tags, then create beautiful print-ready
            books.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Quick Capture</h3>
              <p className="text-muted-foreground">
                Add quotes in under 10 seconds. Tag people, add photos, and
                organize effortlessly.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Beautiful Books</h3>
              <p className="text-muted-foreground">
                Generate print-ready PDF books with elegant layouts, perfect for
                printing and sharing.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your family&apos;s memories stay private. Share only with your
                household members.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 SaySo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}



