import { AlertCircle } from "lucide-react";

export default function MyError({ text }: { text: string }) {
  return (
    <div className="alert flex h-full justify-center bg-base-200/50">
      <AlertCircle />
      <span>{text}</span>
    </div>
  );
}
