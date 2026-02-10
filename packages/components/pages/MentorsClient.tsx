"use client";

import { Feature183 } from "@/components/pages/Mentors/feature183";
import type { Feature183Content } from "@/components/pages/Mentors/feature183";
import { Feature170 } from "@/components/pages/Mentors/feature170";
import type { Feature170Content } from "@/components/pages/Mentors/feature170";
import { Feature62 } from "@/components/pages/Mentors/feature62";
import type { Feature62Content } from "@/components/pages/Mentors/feature62";
import { Hero91 } from "@/components/pages/Mentors/hero91";
import type { Hero91Content } from "@/components/pages/Mentors/hero91";

interface MentorsClientProps {
  title: string;
  description?: string;
  hero?: Hero91Content;
  feature62?: Feature62Content;
  feature170?: Feature170Content;
  feature183?: Feature183Content;
}

export function MentorsClient({
  title,
  description,
  hero,
  feature62,
  feature170,
  feature183,
}: MentorsClientProps) {
  const heroContent: Hero91Content =
    hero ?? {
      title,
      description: description ?? "",
      button1: "",
      button2: "",
    };
  return (
    <div className="flex-1">
      <Hero91 content={heroContent} />
      <Feature62 content={feature62} />
      <Feature170 className="bg-muted" content={feature170} />
      <Feature183 content={feature183} />
    </div>
  );
}
