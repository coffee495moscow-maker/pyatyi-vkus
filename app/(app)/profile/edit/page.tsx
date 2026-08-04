import { getCurrentProfile } from "@/lib/queries/profile";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl">Редактировать профиль</h1>
      <EditProfileForm
        fullName={profile?.full_name ?? ""}
        phone={profile?.phone ?? ""}
      />
    </div>
  );
}
