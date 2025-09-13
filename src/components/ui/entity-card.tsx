import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Variant = "thumb" | "compact";

type EntityCardProps = {
  title: string;
  description?: string;
  href?: string;
  thumbnail?: string;
  placeholder?: string;  
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
};

export default function EntityCard({
  title,
  description,
  href,
  thumbnail,
  placeholder = "bg-muted",
  variant = "compact",
  className,
  children,
}: EntityCardProps) {
  const [cover, setCover] = useState(thumbnail);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCover(url);
    }
  };

  const inner =
    variant === "thumb" ? (
      <Card className={cn("overflow-hidden hover:shadow-md transition", className)}>
        <div className="h-32 w-full flex items-center justify-center bg-zinc-800 text-white text-sm cursor-pointer relative">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              <span>Click to add cover</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <div className="p-3">
          <div className="text-sm font-medium">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </Card>
    ) : (
      <Card className={cn("p-4 hover:shadow-md transition", className)}>
        {children ? <div className="mb-2">{children}</div> : null}
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </Card>
    );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
