"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert("Check your email for confirmation link!");
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/tasks");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Login / Sign Up</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-2"
      />
      <div className="flex gap-2">
        <button onClick={handleSignIn} className="bg-blue-500 text-white px-4 py-2">
          Sign In
        </button>
        <button onClick={handleSignUp} className="bg-green-500 text-white px-4 py-2">
          Sign Up
        </button>
      </div>
    </div>
  );
}
