
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  savePaymentMethodData, 
  getAllPaymentMethods, 
  getPaymentMethodsByDateRange,
  deletePaymentMethodData,
  PaymentMethodData 
} from '@/lib/paymentMethodService';
import { DateRange } from '@/pages/Index';

const PAYMENT_METHODS = [
  'PayPal',
  'Carta di Credito',
  'Bonifico Bancario',
  'Contrassegno',
  'Contanti',
  'Altro'
];

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface PaymentMethodsManagerProps {
  dateRange?: DateRange;
}

export const PaymentMethodsManager = ({ dateRange }: PaymentMethodsManagerProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({
    month: '',
    payment_method: '',
    orders_count: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentMethods();
  }, [dateRange]);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      let data: PaymentMethodData[];
      
      if (dateRange?.type !== 'all' && dateRange?.startDate && dateRange?.endDate) {
        data = await getPaymentMethodsByDateRange(dateRange.startDate, dateRange.endDate);
      } else {
        data = await getAllPaymentMethods();
      }
      
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare i dati dei metodi di pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntry.month || !newEntry.payment_method || newEntry.orders_count <= 0) {
      toast({
        title: "Dati mancanti",
        description: "Compila tutti i campi richiesti",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await savePaymentMethodData(newEntry);
      
      setNewEntry({
        month: '',
        payment_method: '',
        orders_count: 0
      });
      
      await loadPaymentMethods();
      
      toast({
        title: "Dati salvati",
        description: "I dati del metodo di pagamento sono stati salvati con successo"
      });
    } catch (error) {
      console.error('Error saving payment method data:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare i dati del metodo di pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deletePaymentMethodData(id);
      await loadPaymentMethods();
      
      toast({
        title: "Dati eliminati",
        description: "I dati del metodo di pagamento sono stati eliminati"
      });
    } catch (error) {
      console.error('Error deleting payment method data:', error);
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare i dati del metodo di pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateByPaymentMethod = () => {
    const aggregated = new Map<string, number>();
    
    paymentMethods.forEach(pm => {
      const current = aggregated.get(pm.payment_method) || 0;
      aggregated.set(pm.payment_method, current + pm.orders_count);
    });

    return Array.from(aggregated.entries()).map(([method, count], index) => ({
      name: method,
      value: count,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  const chartData = aggregateByPaymentMethod();
  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestione Metodi di Pagamento</CardTitle>
          <CardDescription>
            Aggiungi e visualizza i dati sui metodi di pagamento utilizzati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="month">Mese</Label>
                <Input
                  id="month"
                  type="month"
                  value={newEntry.month}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, month: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment-method">Metodo di Pagamento</Label>
                <Select 
                  value={newEntry.payment_method} 
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="orders-count">Numero Ordini</Label>
                <Input
                  id="orders-count"
                  type="number"
                  min="1"
                  value={newEntry.orders_count || ''}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, orders_count: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi
                </Button>
              </div>
            </div>
          </form>

          {paymentMethods.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mese</TableHead>
                    <TableHead>Metodo di Pagamento</TableHead>
                    <TableHead className="text-right">Numero Ordini</TableHead>
                    <TableHead className="w-[100px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((pm) => (
                    <TableRow key={pm.id}>
                      <TableCell>
                        {format(new Date(pm.month + 'T00:00:00'), 'MMMM yyyy', { locale: it })}
                      </TableCell>
                      <TableCell>{pm.payment_method}</TableCell>
                      <TableCell className="text-right">{pm.orders_count}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pm.id!)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Metodi di Pagamento</CardTitle>
            <CardDescription>
              Visualizzazione dei metodi di pagamento per numero di ordini (Totale: {totalOrders} ordini)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Ordini']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};
