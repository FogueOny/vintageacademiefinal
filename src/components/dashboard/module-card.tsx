"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Headphones, Mic, PenTool } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  links: Array<{
    href: string;
    label: string;
  }>;
  icon?: string;
}

export function ModuleCard({ title, description, links, icon = "default" }: ModuleCardProps) {
  // Fonction pour obtenir l'icône appropriée
  const getIcon = () => {
    switch (icon) {
      case "book":
        return <BookOpen className="h-6 w-6 text-primary" />;
      case "writing":
        return <PenTool className="h-6 w-6 text-primary" />;
      case "listening":
        return <Headphones className="h-6 w-6 text-primary" />;
      case "speaking":
        return <Mic className="h-6 w-6 text-primary" />;
      default:
        return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getIcon()}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="block p-3 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
