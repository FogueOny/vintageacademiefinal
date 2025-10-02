"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";

interface ProfileCardProps {
  user: any;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
            {user?.user_metadata?.avatar_url ? (
              <Image 
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <span className="text-xl font-bold text-orange-600">
                {(user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Bienvenue, {user?.user_metadata?.full_name || user?.email || "Apprenant"}
            </h2>
            <p className="text-sm text-gray-500">
              Consultez vos modules de formation et commencez votre préparation au TCF
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
