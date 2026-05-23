import { ProfileForm } from "@/components/profile-form";
import { SiweButton } from "@/components/siwe-button";

export default function EditProfilePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Work profile</h1>
          <p className="text-black/70">Connect wallet, sign in, list skills.</p>
        </div>
        <SiweButton />
      </div>
      <ProfileForm />
    </section>
  );
}
