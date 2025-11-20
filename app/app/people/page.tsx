import { redirect } from "next/navigation"

export default async function PeoplePage() {
  // Redirect to entries page (home) since people are now managed in the sidebar
  redirect("/app")
}





