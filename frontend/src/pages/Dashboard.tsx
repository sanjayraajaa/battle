
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Dashboard = () => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome to your Battle workspace.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder Cards */}
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold">Project Alpha {i}</CardTitle>
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                                Active
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12 Tasks</div>
                            <p className="text-xs text-muted-foreground">Due in 3 days</p>

                            <div className="mt-4 w-full bg-secondary rounded-full h-2 overflow-hidden">
                                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${i * 30}%` }}></div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">Last updated 2 hours ago</p>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
