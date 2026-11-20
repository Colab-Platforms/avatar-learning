import { redirect } from "next/navigation";

// Contacts moved into the WhatsApp Inbox (Contacts tab). Old links and bookmarks keep working.
export default function ContactsRedirect() {
  redirect("/admin-adaption/inbox?tab=contacts");
}
