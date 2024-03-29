import { AlertCircle } from "lucide-react";

export default function MyError({ text }: { text: string }) {
  return (
    <div className="alert flex h-full justify-center">
      <AlertCircle />
      <span>{text}</span>
    </div>
  );
}
