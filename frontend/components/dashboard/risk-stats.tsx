'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { riskApi, RiskDistribution } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function RiskStats() {
  const [stats, setStats] = useState<RiskDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'bar' | 'pie'>('bar');
  const { theme } = useTheme();
  
  const fetchRiskStats = async () => {
    try {
      setIsLoading(true);
      const data = await riskApi.getRiskDistribution();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.detail || 'Failed to load risk statistics');
      console.error('Error fetching risk stats:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRiskStats();
  }, []);
  
  if (isLoading) {
    return <RiskStatsSkeleton />;
  }
  
  if (error || !stats) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>{error || 'Failed to load risk statistics'}</span>
          <Button variant="outline" size="sm" onClick={fetchRiskStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  const chartData = [
    { name: 'Low Risk', value: stats.low_risk_count, color: '#10b981' },
    { name: 'Medium Risk', value: stats.medium_risk_count, color: '#f59e0b' },
    { name: 'High Risk', value: stats.high_risk_count, color: '#ef4444' }
  ];
  
  const totalCustomers = stats.total_customers;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Low Risk"
          value={stats.low_risk_count}
          total={totalCustomers}
          icon={<CheckCircle className="h-4 w-4" />}
          color="text-green-500"
          bgColor="bg-green-100 dark:bg-green-950"
        />
        
        <StatCard
          title="Medium Risk"
          value={stats.medium_risk_count}
          total={totalCustomers}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-amber-500"
          bgColor="bg-amber-100 dark:bg-amber-950"
        />
        
        <StatCard
          title="High Risk"
          value={stats.high_risk_count}
          total={totalCustomers}
          icon={<AlertCircle className="h-4 w-4" />}
          color="text-red-500"
          bgColor="bg-red-100 dark:bg-red-950"
        />
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Distribution of customers across risk categories</CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button
                variant={viewType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('bar')}
                className="h-8 px-2"
              >
                Bar
              </Button>
              <Button
                variant={viewType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('pie')}
                className="h-8 px-2"
              >
                Pie
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {viewType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      color: theme === 'dark' ? '#f9fafb' : '#111827'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Customers"
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      color: theme === 'dark' ? '#f9fafb' : '#111827'
                    }}
                    formatter={(value: number) => [`${value} customers`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Last updated: {new Date(stats.last_updated).toLocaleString()}
        </CardFooter>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, total, icon, color, bgColor }: StatCardProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <Card className={cn("overflow-hidden border", bgColor)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", color, "bg-white/80 dark:bg-gray-950/80")}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{percentage}% of total customers</p>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn("h-2 rounded-full", {
              "bg-green-500": title === "Low Risk",
              "bg-amber-500": title === "Medium Risk",
              "bg-red-500": title === "High Risk",
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RiskStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-2 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-48" />
        </CardFooter>
      </Card>
    </div>
  );
}