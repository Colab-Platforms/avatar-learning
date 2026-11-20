import { redirect } from "next/navigation";

/** /account → the AI Adoption "My Account" dashboard. */
export default function AccountRedirect() {
  redirect("/adoption/account");
}
