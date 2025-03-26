'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { mitigationsApi, customersApi, CustomerWithRisk, MitigationCreate } from '@/lib/api';

// Form schema
const formSchema = z.object({
  customer_id: z.string({
    required_error: 'Please select a customer',
  }),
  mitigation_type: z.enum(['Flag', 'Note', 'Action', 'Monitor'], {
    required_error: 'Please select a mitigation type',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters',
  }),
  assigned_to: z.string().optional(),
  due_date: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MitigationForm() {
  const [highRiskCustomers, setHighRiskCustomers] = useState<CustomerWithRisk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: '',
      mitigation_type: 'Flag',
      description: '',
      assigned_to: '',
    },
  });
  
  // Fetch high-risk customers
  useEffect(() => {
    const fetchHighRiskCustomers = async () => {
      try {
        const data = await customersApi.getCustomers({ risk_level: 'High' });
        setHighRiskCustomers(data);
      } catch (err: any) {
        setError(err.detail || 'Failed to load high-risk customers');
        console.error('Error fetching high-risk customers:', err);
      }
    };
    
    fetchHighRiskCustomers();
  }, []);
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create the mitigation data
      const mitigationData: MitigationCreate = {
        customer_id: values.customer_id,
        risk_level: 'High', // Mitigations are only for high-risk customers
        mitigation_type: values.mitigation_type,
        description: values.description,
        assigned_to: values.assigned_to || undefined,
        due_date: values.due_date 
          ? values.due_date.toISOString() 
          : undefined,
      };
      
      // Submit the mitigation
      await mitigationsApi.createMitigation(mitigationData);
      
      // Reset form and show success message
      form.reset();
      setSuccess('Mitigation measure created successfully');
    } catch (err: any) {
      setError(err.detail || 'Failed to create mitigation');
      console.error('Error creating mitigation:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply Mitigation Measure</CardTitle>
        <CardDescription>
          Create mitigation actions for high-risk customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 border-green-500 text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a high-risk customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {highRiskCustomers.length === 0 ? (
                        <SelectItem value="no-customers" disabled>
                          No high-risk customers available
                        </SelectItem>
                      ) : (
                        highRiskCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} {customer.external_id ? `(${customer.external_id})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only high-risk customers are eligible for mitigation measures
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="mitigation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mitigation Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mitigation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Flag">Flag</SelectItem>
                      <SelectItem value="Note">Note</SelectItem>
                      <SelectItem value="Action">Action</SelectItem>
                      <SelectItem value="Monitor">Monitor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of mitigation to apply
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the mitigation measure in detail"
                      className="resize-none"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide clear details about the mitigation action
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name or email of person responsible"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Who is responsible for this mitigation measure
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When this mitigation measure should be completed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || highRiskCustomers.length === 0}
            >
              {isLoading ? 'Submitting...' : 'Create Mitigation Measure'}
            </Button>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}