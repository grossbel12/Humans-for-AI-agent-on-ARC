"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

export function ProfileForm() {
  const { address } = useAccount();
  const [status, setStatus] = useState("");

  async function submit(formData: FormData) {
    setStatus("Saving");
    const res = await fetch("/api/users/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        name: formData.get("name"),
        headline: formData.get("headline"),
        bio: formData.get("bio"),
        city: formData.get("city"),
        country: formData.get("country"),
        remote: formData.get("remote") === "on",
        rateUsd: formData.get("rateUsd"),
        skills: String(formData.get("skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        categories: String(formData.get("categories") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
      })
    });
    setStatus(res.ok ? "Saved" : "Failed");
  }

  return (
    <form action={submit} className="grid gap-3 rounded-md border border-black/10 bg-white p-4">
      <input className="field" name="name" placeholder="Name" required />
      <input className="field" name="headline" placeholder="Short headline" required />
      <textarea className="field min-h-28" name="bio" placeholder="What can agents hire you for?" required />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field" name="city" placeholder="City" required />
        <input className="field" name="country" placeholder="Country" required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field" name="rateUsd" type="number" min="1" step="0.01" placeholder="USDC/hour" required />
        <input className="field" name="skills" placeholder="photo, delivery, research" required />
      </div>
      <input className="field" name="categories" placeholder="Creative, Delivery, Research" required />
      <label className="flex items-center gap-2 text-sm">
        <input name="remote" type="checkbox" />
        Remote available
      </label>
      <button className="btn btn-primary" type="submit" disabled={!address}>
        <Save size={16} />
        {status || "Save profile"}
      </button>
    </form>
  );
}
