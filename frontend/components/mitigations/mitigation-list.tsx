'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertCircle, 
  CalendarClock, 
  CheckCircle, 
  Clock, 
  Flag, 
  Pencil, 
  RefreshCw, 
  User2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mitigationsApi, Mitigation, MitigationStatus, MitigationType } from '@/lib/api';

export default function MitigationList() {
  const [mitigations, setMitigations] = useState<Mitigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<MitigationStatus | 'all'>('all');
  
  const fetchMitigations = async (status?: MitigationStatus | 'all') => {
    try {
      setIsLoading(true);
      const params = status && status !== 'all' ? { status } : undefined;
      const data = await mitigationsApi.getMitigations(params);
      setMitigations(data);
      setError(null);
    } catch (err: any) {
      setError(err.detail || 'Failed to load mitigations');
      console.error('Error fetching mitigations:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const status = selectedTab !== 'all' ? selectedTab as MitigationStatus : undefined;
    fetchMitigations(status);
  }, [selectedTab]);
  
  const handleRefresh = () => {
    const status = selectedTab !== 'all' ? selectedTab as MitigationStatus : undefined;
    fetchMitigations(status);
  };
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value as MitigationStatus | 'all');
  };
  
  const updateMitigationStatus = async (id: string, status: MitigationStatus) => {
    try {
      setIsLoading(true);
      await mitigationsApi.updateMitigationStatus(id, status);
      
      // Refresh the list after update
      const currentStatus = selectedTab !== 'all' ? selectedTab as MitigationStatus : undefined;
      await fetchMitigations(currentStatus);
    } catch (err: any) {
      setError(err.detail || 'Failed to update mitigation status');
      console.error('Error updating mitigation status:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Mitigations</CardTitle>
            <CardDescription>
              View and manage customer risk mitigations
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", { "animate-spin": isLoading })} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 mb-4">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-destructive mr-2 mt-0.5" />
              <span className="text-destructive text-sm">
                {error}
              </span>
            </div>
          </div>
        )}
        
        <Tabs 
          defaultValue={selectedTab} 
          value={selectedTab}
          onValueChange={handleTabChange}
          className="mb-4"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="In Progress">In Progress</TabsTrigger>
            <TabsTrigger value="Completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <MitigationItemSkeleton key={i} />
              ))}
            </div>
          ) : mitigations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-2">No mitigations found</div>
              <div className="text-sm">
                {selectedTab === 'all'
                  ? 'Create a new mitigation for a high-risk customer'
                  : `No ${selectedTab.toLowerCase()} mitigations available`}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {mitigations.map((mitigation) => (
                <MitigationItem
                  key={mitigation.id}
                  mitigation={mitigation}
                  onStatusChange={updateMitigationStatus}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface MitigationItemProps {
  mitigation: Mitigation;
  onStatusChange: (id: string, status: MitigationStatus) => void;
}

function MitigationItem({ mitigation, onStatusChange }: MitigationItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleStatusChange = async (status: MitigationStatus) => {
    try {
      setIsUpdating(true);
      await onStatusChange(mitigation.id, status);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const statusColors = {
    Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };
  
  const typeIcons = {
    Flag: <Flag className="h-4 w-4" />,
    Note: <Pencil className="h-4 w-4" />,
    Action: <AlertCircle className="h-4 w-4" />,
    Monitor: <Clock className="h-4 w-4" />,
  };
  
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            {typeIcons[mitigation.mitigation_type as MitigationType]}
          </div>
          <div>
            <div className="font-medium">{mitigation.mitigation_type}</div>
            <div className="text-sm text-muted-foreground">
              Created {formatDate(mitigation.created_at)}
            </div>
          </div>
        </div>
        <Badge className={cn(statusColors[mitigation.status as MitigationStatus])}>
          {mitigation.status}
        </Badge>
      </div>
      
      <div className="mt-3 text-sm">
        {mitigation.description}
      </div>
      
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {mitigation.assigned_to && (
          <div className="flex items-center gap-1">
            <User2 className="h-3.5 w-3.5" />
            {mitigation.assigned_to}
          </div>
        )}
        
        {mitigation.due_date && (
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Due: {formatDate(mitigation.due_date)}
          </div>
        )}
      </div>
      
      {mitigation.status !== 'Completed' && mitigation.status !== 'Cancelled' && (
        <div className="mt-3 flex justify-end gap-2">
          {mitigation.status === 'Pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('In Progress')}
              disabled={isUpdating}
            >
              Start
            </Button>
          )}
          
          {mitigation.status === 'In Progress' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Completed')}
              disabled={isUpdating}
              className="text-green-600 dark:text-green-500"
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              Complete
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusChange('Cancelled')}
            disabled={isUpdating}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function MitigationItemSkeleton() {
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      <div className="mt-3">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      <div className="mt-3 flex justify-end gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}