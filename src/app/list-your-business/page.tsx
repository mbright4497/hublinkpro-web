import { redirect } from "next/navigation";

// Listing is now self-service: sign in, build your Channel, submit it for review.
export default function ListYourBusiness() {
  redirect("/dashboard");
}
