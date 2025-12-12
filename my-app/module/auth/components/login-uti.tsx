"use client"

import React, { useState } from 'react'
import { GithubIcon } from 'lucide-react'
import { signIn } from '@/lib/auth-client'

const LoginUI = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGithubLogin = async () => {
        setIsLoading(true);
        try {
            await signIn.social({ provider: 'github' });
        } catch (error) {
            console.log("Login Error: ", error);
            setIsLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-black via-black to-zinc-900 text-white flex'>
            {/* Left Section */}
            <div className='flex-1 flex flex-col justify-center px-12 py-16 lg:px-20'>
                <div className='max-w-2xl'>
                    {/* Logo */}
                    <div className='mb-16'>
                        <div className='inline-flex items-center gap-3 text-2xl font-bold'>
                            <div className='w-10 h-10 bg-primary rounded-lg flex items-center justify-center'>
                                <span className='text-xl'>🐰</span>
                            </div>
                            <span>CodeRevU</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <h1 className='text-5xl lg:text-6xl font-bold mb-6 leading-tight'>
                        Cut Code Review<br />
                        Time & Bugs in <span className='text-primary'>Half.</span><br />
                        <span className='text-primary'>Instantly.</span>
                    </h1>

                    <p className='text-gray-400 text-lg font-mono'>
                        Supercharge your team to ship faster with the most<br />
                        advanced AI code reviews.
                    </p>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className='flex-1 flex flex-col justify-center items-center px-12 py-16 bg-gradient-to-br from-zinc-900/50 to-transparent'>
                <div className='w-full max-w-md'>
                    {/* Welcome Text */}
                    <div className='mb-10'>
                        <h2 className='text-4xl font-bold mb-3 text-primary'>Welcome Back</h2>
                        <p className='text-gray-400 text-base'>
                            Login using the following provider:
                        </p>
                    </div>

                    {/* Github Login Button */}
                    <button 
                        onClick={handleGithubLogin}
                        disabled={isLoading}
                        className='w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 group'
                    >
                        <GithubIcon className='w-5 h-5 group-hover:scale-110 transition-transform' />
                        <span>{isLoading ? "Signing in..." : "GitHub"}</span>
                        <span className='ml-auto text-xs text-primary font-semibold tracking-wider'>CLOUD</span>
                    </button>

                    {/* Footer Links */}
                    <div className='mt-10 text-center'>
                        <p className='text-gray-400 text-sm'>
                            New to CodeRevU?{' '}
                            <a href="#" className='text-primary hover:text-primary-foreground font-medium transition-colors'>
                                Sign Up
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className='absolute bottom-0 left-0 right-0 p-6 text-center text-xs text-gray-500'>
                By continuing, you agree to the{' '}
                <a href="#" className='text-primary hover:text-primary-foreground transition-colors'>
                    Terms of Use
                </a>
                {' '}and{' '}
                <a href="#" className='text-primary hover:text-primary-foreground transition-colors'>
                    Privacy Policy
                </a>
                {' '}applicable to CodeRevU
            </div>
        </div>
    )
}

export default LoginUI