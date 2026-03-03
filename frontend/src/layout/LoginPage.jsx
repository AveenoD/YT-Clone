import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import {useToast} from '../toaster/UseToast.js'

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    
    const baseURL = import.meta.env.VITE_BACKEND_URL;
    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await axios.post(`${baseURL}/api/v1/users/login`, {
                email,
                password
            });
            
            const data = response.data.data;
            console.log('Login success: ', data);

            const { accessToken, refreshToken, user } = response.data.data;
            localStorage.setItem("token", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
            toast.success(`Welcome back, ${user.fullName || user.username}! 👋`);
            navigate('/');
        } catch (error) {
            if (error.response) {
                toast.error(error.response?.data?.message || "Login failed");
                
            } else {
                toast.error("Cannot connect to server. Check your internet.");
            }
        } finally {
            
            setLoading(false)
        }


    }
    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4 py-10">

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-3xl px-8 py-10 sm:px-12 sm:py-12
                      shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04),0_20px_50px_-10px_rgba(99,102,241,0.18),0_40px_80px_-20px_rgba(0,0,0,0.08)]
                      ring-1 ring-indigo-50">

                {/* Brand Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50
                        border border-indigo-100 rounded-full px-3 py-1.5 mb-7">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500
                          rounded-full flex items-center justify-center">
                        <Sparkles size={12} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-semibold text-indigo-500 tracking-wide">
                        Welcome back
                    </span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                    Login in to your <br /> account
                </h1>
                <p className="text-sm text-gray-400 mb-8">
                    Enter your credentials to continue
                </p>

                {/* Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-5">

                    {/* Email Field */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-gray-600">
                            Email address
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-gray-300 pointer-events-none">
                                <Mail size={17} strokeWidth={2} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="w-full pl-11 pr-4 py-3.5 text-sm text-gray-800
                           bg-gray-50 border border-gray-200 rounded-2xl outline-none
                           placeholder:text-gray-300
                           focus:border-indigo-400 focus:bg-white
                           focus:ring-4 focus:ring-indigo-100
                           transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm font-medium text-gray-600">
                            Password
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-gray-300 pointer-events-none">
                                <Lock size={17} strokeWidth={2} />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="w-full pl-11 pr-12 py-3.5 text-sm text-gray-800
                           bg-gray-50 border border-gray-200 rounded-2xl outline-none
                           placeholder:text-gray-300
                           focus:border-indigo-400 focus:bg-white
                           focus:ring-4 focus:ring-indigo-100
                           transition-all duration-200"
                            />
                            {/* Show / Hide Password */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 p-2 rounded-xl text-gray-300
                           hover:text-indigo-400 hover:bg-indigo-50
                           transition-all duration-200"
                            >
                                {showPassword
                                    ? <EyeOff size={17} strokeWidth={2} />
                                    : <Eye size={17} strokeWidth={2} />
                                }
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="flex justify-end -mt-2">
                        <a
                            href="#"
                            className="text-xs font-semibold text-indigo-500
                         hover:text-indigo-700 hover:underline
                         transition-colors duration-200"
                        >
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3.5 flex items-center justify-center gap-2
                       bg-gradient-to-r from-indigo-500 to-purple-500
                       hover:from-indigo-600 hover:to-purple-600
                       text-white text-sm font-semibold rounded-2xl
                       shadow-lg shadow-indigo-200
                       hover:shadow-xl hover:shadow-indigo-300
                       hover:-translate-y-0.5
                       active:translate-y-0 active:shadow-md
                       transition-all duration-200 group"
                    >
                        {loading ? "Logging in.." : "Login"}
                        <ArrowRight
                            size={16}
                            strokeWidth={2.5}
                            className="group-hover:translate-x-1 transition-transform duration-200"
                        />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
                            New to the platform?
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <span className="text-sm text-gray-400">
                            Don't have an account?{" "}
                            <Link
                                to={'/register'}
                                className="text-indigo-500 font-semibold
                           hover:text-indigo-700 border-b border-transparent
                           hover:border-indigo-500 transition-all duration-200"
                            >
                                Create one for free
                            </Link>
                        </span>
                    </div>

                </form>
            </div>
        </div>
    );
}