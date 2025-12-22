"use client"

import {Card,CardContent,CardDescription,CardHeader,CardTitle} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw,Loader2,Check } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import {checkout,customer} from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import {Alert,AlertDescription,AlertTitle} from "@/components/ui/alert"
import { useEffect,useState } from "react";
import {toast} from "sonner";

const PLAN_FEATURES = {
  free: [
    { name: "Up to 5 repositories", included: true },
    { name: "Up to 5 reviews per repository", included: true },
    { name: "Basic code reviews", included: true },
    { name: "Community support", included: true },
    { name: "Advanced analytics", included: false },
    { name: "Priority support", included: false },
  ],

  pro: [
    { name: "Unlimited repositories", included: true },
    { name: "Unlimited reviews", included: true },
    { name: "Advanced code reviews", included: true },
    { name: "Email support", included: true },
    { name: "Advanced analytics", included: true },
    { name: "Priority support", included: true },
  ],
};

export default function subscriptionPage (){
    const [checkoutLoading,setCheckoutLoading] = useState(false);
    const [portalLoading,setPortalLoading] = useState(false);
    const [syncLoading,setSyncLoading] = useState(false);
    const searchParams = useSearchParams();
    const success = searchParams.get("success");
}



