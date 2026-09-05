"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ScreenshotUpload({
  pathPrefix,
  label = "Add a screenshot",
  onUploaded,
}: {
  pathPrefix: string;
  label?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    const ext = file.name.split(".").pop() || "png";
    const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("screenshots").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
    onUploaded(data.publicUrl);
    setBusy(false);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="text-xs flex items-center gap-1.5 text-muted-2 hover:text-muted disabled:opacity-60"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
        {busy ? "Uploading…" : label}
      </button>
      {error && <p className="text-xs text-tally mt-1">{error}</p>}
    </div>
  );
}
