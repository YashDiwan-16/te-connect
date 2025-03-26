'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { customersApi, CustomerWithRisk, RiskLevel } from '@/lib/api';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Info, 
  MoreHorizontal, 
  RefreshCw, 
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomerTable() {
  const [customers, setCustomers] = useState<CustomerWithRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  
  const itemsPerPage = 10;
  
  const fetchCustomers = async (riskLevel?: RiskLevel) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customersApi.getCustomers({
        risk_level: riskLevel,
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      });
      setCustomers(data);
    } catch (err: any) {
      setError(err.detail || 'Failed to load customers');
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    const riskLevel = selectedTab !== 'all' ? selectedTab as RiskLevel : undefined;
    fetchCustomers(riskLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedTab]);
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      (customer.email && customer.email.toLowerCase().includes(search)) ||
      (customer.external_id && customer.external_id.toLowerCase().includes(search))
    );
  });
  
  const handleRefresh = () => {
    const riskLevel = selectedTab !== 'all' ? selectedTab as RiskLevel : undefined;
    fetchCustomers(riskLevel);
  };
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setCurrentPage(1); // Reset to first page on tab change
  };
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers;
  
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              Manage and monitor your customer risk levels
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="w-full sm:w-[250px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-md bg-destructive/15 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <span className="text-destructive font-medium">
                {error}
              </span>
            </div>
          </div>
        ) : null}
        
        <Tabs 
          defaultValue={selectedTab} 
          value={selectedTab}
          onValueChange={handleTabChange}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Low">Low Risk</TabsTrigger>
            <TabsTrigger value="Medium">Medium Risk</TabsTrigger>
            <TabsTrigger value="High">High Risk</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Last Prediction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-[180px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[100px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[120px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm
                      ? 'No customers found matching your search.'
                      : 'No customers found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.email || 'No email provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {customer.external_id
                          ? customer.external_id
                          : customer.id.substring(0, 8) + '...'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RiskBadge riskLevel={customer.risk_level} />
                    </TableCell>
                    <TableCell>
                      {customer.last_prediction
                        ? new Date(customer.last_prediction).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Update Prediction
                          </DropdownMenuItem>
                          {customer.risk_level === 'High' && (
                            <DropdownMenuItem>
                              Add Mitigation
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-
            {Math.min(endIndex, filteredCustomers.length)} of{' '}
            {filteredCustomers.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const variants = {
    Low: {
      className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
      icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
    },
    Medium: {
      className: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300',
      icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />,
    },
    High: {
      className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
      icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
    },
  };

  const { className, icon } = variants[riskLevel] || variants.Low;

  return (
    <div className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}>
      {icon}
      {riskLevel} Risk
    </div>
  );
}