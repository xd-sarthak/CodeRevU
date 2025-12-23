"use client"

import {Card,CardContent,CardDescription,CardHeader,CardTitle} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw,Loader2,Check,X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import {checkout,customer} from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import {Alert,AlertDescription,AlertTitle} from "@/components/ui/alert"
import { useEffect,useState } from "react";
import {toast} from "sonner";
import { getSubscriptionData, syncSubscriptionStatus } from "@/module/payment/actions";
import { Spinner } from "@/components/ui/spinner";

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

    const {data,isLoading,error,refetch} = useQuery({
        queryKey:["subscription-data"],
        queryFn:getSubscriptionData,
        refetchOnWindowFocus:true
    });

    useEffect(() => {
        if(success === "true"){
            const sync = async () => {
                try {
                    await syncSubscriptionStatus();
                    refetch();
                } catch (error) {
                    console.error("Failed to sync subscription status: ",error);
                }
            }
            sync();
        }
    },[success,refetch])

    if(isLoading){
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner/>
            </div>
        )
    }

    if(error){
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">Failed to load subscription data</p>
                </div>
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load subscription data. Please try again.
                        <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>Retry</Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if(!data?.user){
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">Failed to load subscription data</p>
                </div>
            </div>
        )
    }

    const currentTier = data.user.subscriptionTier as "FREE" | "PRO"
    const isPro = currentTier === "PRO";
    const isActive = data.user.subscriptionStatus === "ACTIVE";

    const handleSync = async () => {
        try {
            setSyncLoading(true);
            const result = await syncSubscriptionStatus();
            if(result.success){
                toast.success("Subscription status synced successfully");
                refetch();
            } else{
                toast.error("Failed to sync subscription status. Please try again.");
            }
        } catch (error) {
            toast.error("Failed to sync subscription status. Please try again.");
        }
        finally{
            setSyncLoading(false);
        }
    }

    const handleManageSubscription = async () => {
        try {
            setPortalLoading(true);
            await customer.portal();
        } catch (error) {
            console.error("Failed to open portal: ",error);
            setPortalLoading(false);
            toast.error("Failed to open subscription portal. Please try again.");
            
        }
        finally{
            setPortalLoading(false);
        }
    }

    const handleUpgrade = async () => {
        try {
            setCheckoutLoading(true);

            await checkout({
                slug:"coderevu"
            })
        } catch (error) {
            console.error("Failed to initiate checkout: ", error);
            setCheckoutLoading(false);
            toast.error("Failed to initiate checkout. Please try again.");
            
        }
        finally{
            setCheckoutLoading(false);
        }
    }





    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">Manage your subscription plan</p>
                </div>

                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncLoading}>
                        {syncLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4 mr-2"/>}
                        Sync Status
                </Button>
            </div>
            {success === "true" && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <Check className="h-4 w-4 text-green-600"/>
                        <AlertTitle>
                            Success!
                        </AlertTitle>
                        <AlertDescription>
                            Your subscription has been updated.
                        </AlertDescription>
                </Alert>
            )}

            {/* current usage*/}
            {data.limits && (
                <Card>
                    <CardHeader>
                        <CardTitle>Current Usage</CardTitle>
                        <CardDescription>
                            Your current plans and usage limits
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Repositories</span>
                                    <Badge variant={data.limits.repositories.canAdd ? "default" : "destructive"}>
                                        {data.limits.repositories.current}/{data.limits.repositories.limit ?? "unlimited"}
                                    </Badge>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                    className={`h-full ${data.limits.repositories.canAdd ? "bg-primary" : "bg-muted"}`}
                                    style={{
                                        width: data.limits.repositories.limit ? `${Math.min((data.limits.repositories.current/data.limits.repositories.limit)*100,100)}%` : "0%"
                                    }}
                                    />  
                                </div>
                            </div>
                            <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Reviews per Repository</span>
                                        <Badge variant="outline">{isPro ? "Unlimited" : "5 per repository"}</Badge>
                                    </div>
                                    <p>
                                        {isPro ? "No limits on reviews" : "Free tier allows 5 reviews per repository"}
                                    </p>
                            </div>
                        </div>
                        
                    </CardContent>
                </Card>
            )}

            {/* plans */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* free plan */}
                <Card className={!isPro ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Free</CardTitle>
                            <CardDescription>
                            The best plan for small teams
                            </CardDescription>
                        </div>
                        {!isPro && <Badge className="ml-2">Current Plan</Badge>}
                    </div>

                    <div className="mt-2">
                        <span className="text-3xl font-bold">$0</span>
                        <span className="text-muted-foreground">/month</span>
                    </div>                        
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {PLAN_FEATURES.free.map((feature) => (
                                <div key={feature.name} className="flex items-center gap-2">
                                    {feature.included ? (
                                        <Check className="h-4 w-4 text-primary shrink-0"/>
                                    ) : (
                                        <X className="h-4 w-4 tet-muted-foreground shrink-0"/>
                                    )}
                                    <span className={feature.included ? "" : "text-muted-foreground" }>{feature.name}</span>
                                </div>
                            ))}
                        </div>
                        <Button>
                            {isPro ? "Current Plan" : "Downgrade to Free"}
                        </Button>
                    </CardContent>
                </Card>

                {/* pro plan */}
                <Card className={isPro ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pro</CardTitle>
                            <CardDescription>
                            The best plan for large teams
                            </CardDescription>
                        </div>
                        {isPro && <Badge className="ml-2">Current Plan</Badge>}
                    </div>

                    <div className="mt-2">
                        <span className="text-3xl font-bold">$49</span>
                        <span className="text-muted-foreground">/month</span>
                    </div>                        
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {PLAN_FEATURES.pro.map((feature) => (
                                <div key={feature.name} className="flex items-center gap-2">
                                    {feature.included ? (
                                        <Check className="h-4 w-4 text-primary shrink-0"/>
                                    ) : (
                                        <X className="h-4 w-4 tet-muted-foreground shrink-0"/>
                                    )}
                                    <span className={feature.included ? "" : "text-muted-foreground" }>{feature.name}</span>
                                </div>
                            ))}
                        </div>
                        {isPro && isActive ? (
                            <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            >
                                {portalLoading ? (
                                    <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                    Opening Portal...
                                    </>
                                ) : (
                                    <>
                                    Manage Subscription
                                    <ExternalLink className="h-4 w-4 ml-2"/>
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                            className="w-full"
                            onClick={handleUpgrade}
                            disabled={checkoutLoading}
                            >
                                {checkoutLoading ? (
                                    <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                    Redirecting...
                                    </>
                                ) : (
                                    "Upgrade to Pro"
                                )}
                             </Button>   
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )

}



