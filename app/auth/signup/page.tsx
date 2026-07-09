import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignupForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/feed");
  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Join the room</h1>
        <p className="text-sm text-stone mt-1">
          Your wins and struggles, under your own name.
        </p>
      </div>
      <SignupForm />
    </main>
  );
}
