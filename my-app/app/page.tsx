import Image from "next/image";
import {Button} from "@/components/ui/button";
import { requireAuth } from "@/module/auth/utils/auth-utils";
export default async function Home() {
  await requireAuth()
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button>Hello World</Button>
    </div>
  );
}
