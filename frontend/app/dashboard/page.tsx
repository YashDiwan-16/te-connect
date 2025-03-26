import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import RiskStats from '@/components/dashboard/risk-stats';
import CustomerTable from '@/components/dashboard/customer-table';
import MitigationForm from '@/components/mitigations/mitigation-form';
import MitigationList from '@/components/mitigations/mitigation-list';

export const metadata = {
  title: 'Risk Dashboard | Customer Risk Prediction',
  description: 'Monitor customer risk levels and apply mitigation measures',
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Customer Risk Dashboard</h1>
      </div>
      
      {/* Risk Statistics Section */}
      <Suspense fallback={<RiskStatsSkeleton />}>
        <RiskStats />
      </Suspense>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Table Section */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
            <CustomerTable />
          </Suspense>
        </div>
        
        {/* Mitigation Section */}
        <div className="space-y-6">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Add Mitigation</TabsTrigger>
              <TabsTrigger value="list">Recent Mitigations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="mt-4">
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                <MitigationForm />
              </Suspense>
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                <MitigationList />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function RiskStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}