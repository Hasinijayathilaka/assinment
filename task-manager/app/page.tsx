// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Automatically redirect anyone visiting "/" to the login page
  redirect("/login");
}
