import Link from "next/link";
import { Suspense } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/components/auth/SignInForm";
import { signIn } from "./actions";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            One-Link
                        </h1>
                    </Link>
                    <h2
                        id="main-content"
                        className="mt-6 text-3xl font-bold text-gray-900 dark:text-white"
                    >
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account to continue
                    </p>
                </div>

                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle
                            className="text-xl font-semibold text-center"
                            data-testid="signin-heading"
                        >
                            Sign In
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div>Loading...</div>}>
                            <SignInForm action={signIn} />
                        </Suspense>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Don't have an account?{" "}
                                <Link
                                    href="/sign-up"
                                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
