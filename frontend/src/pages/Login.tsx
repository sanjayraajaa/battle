
import { useState } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogIn, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const Login = () => {
    const { login, currentUser, isLoading } = useFrappeAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login({
                username: email,
                password: password,
            });
        } catch (err) {
            setError('Invalid credentials');
            console.error(err);
        }
    };

    if (currentUser) {
        navigate('/');
        return null;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8">
            {/* Professional Background Pattern */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="w-full max-w-[400px]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-background/95 supports-[backdrop-filter]:bg-background/60">
                        <CardHeader className="space-y-1 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                    <Command className="h-6 w-6" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Enter your credentials to login to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="text"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <a href="#" className="text-xs font-medium text-primary hover:underline">
                                            Forgot password?
                                        </a>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-background/50"
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20 text-center">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full font-semibold shadow-sm" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Logging in...
                                        </>
                                    ) : (
                                        <>
                                            Login
                                            <LogIn className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter className="flex flex-col items-center gap-2 border-t p-4 text-center text-xs text-muted-foreground bg-muted/30">
                            <div>
                                Protected by Frappe Auth
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
                <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <a href="#" className="underline underline-offset-4 hover:text-primary">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;

