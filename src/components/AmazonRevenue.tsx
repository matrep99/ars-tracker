
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, TrendingUp, DollarSign, Target } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  saveAmazonRevenue, 
  getAllAmazonRevenue, 
  deleteAmazonRevenue,
  getAmazonRevenueByDateRange,
  AmazonRevenueData 
} from '@/lib/amazonRevenueService';
import type { DateRange } from './DateFilter';

interface AmazonRevenueProps {
  dateRange?: DateRange;
}

export const AmazonRevenue = ({ dateRange }: AmazonRevenueProps) => {
  const [amazonData, setAmazonData] = useState<AmazonRevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    fatturato: '',
    spesa_ads: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAmazonRevenue();
  }, [dateRange]);

  const loadAmazonRevenue = async () => {
    try {
      setIsLoading(true);
      let data: AmazonRevenueData[];
      
      if (dateRange && dateRange.type !== 'all' && dateRange.startDate && dateRange.endDate) {
        data = await getAmazonRevenueByDateRange(dateRange.startDate, dateRange.endDate);
      } else {
        data = await getAllAmazonRevenue();
      }
      
      setAmazonData(data);
    } catch (error) {
      console.error('Error loading Amazon revenue:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare i dati Amazon",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fatturato = parseFloat(formData.fatturato);
    const spesa_ads = parseFloat(formData.spesa_ads);
    
    if (fatturato < 0 || spesa_ads < 0) {
      toast({
        title: "Valori non validi",
        description: "Tutti i valori devono essere numeri positivi",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await saveAmazonRevenue(`${formData.month}-01`, fatturato, spesa_ads);
      await loadAmazonRevenue();
      
      setFormData({
        month: new Date().toISOString().slice(0, 7),
        fatturato: '',
        spesa_ads: ''
      });
      
      toast({
        title: "Dati Amazon salvati",
        description: `Dati per ${format(new Date(formData.month), 'MMMM yyyy', { locale: it })} salvati con successo`
      });
    } catch (error) {
      console.error('Error saving Amazon revenue:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare i dati Amazon",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteAmazonRevenue(id);
      await loadAmazonRevenue();
      toast({
        title: "Dato eliminato",
        description: "Il record Amazon è stato rimosso con successo"
      });
    } catch (error) {
      console.error('Error deleting Amazon revenue:', error);
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare il record",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmazonRevenue = amazonData.reduce((sum, record) => sum + record.fatturato, 0);
  const totalAmazonSpend = amazonData.reduce((sum, record) => sum + record.spesa_ads, 0);
  const overallAmazonROI = totalAmazonSpend > 0 ? ((totalAmazonRevenue - totalAmazonSpend) / totalAmazonSpend) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fatturato Amazon Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">€{totalAmazonRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Spesa Amazon Ads Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">€{totalAmazonSpend.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ROI Amazon Complessivo</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallAmazonROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallAmazonROI.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Revenue Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aggiungi Dati Amazon Mensili
          </CardTitle>
          <CardDescription>Inserisci fatturato e spesa pubblicitaria Amazon per mese</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mese</Label>
                <Input
                  id="month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatturato">Fatturato Amazon (€)</Label>
                <Input
                  id="fatturato"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500.00"
                  value={formData.fatturato}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatturato: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spesa_ads">Spesa Amazon Ads (€)</Label>
                <Input
                  id="spesa_ads"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="300.00"
                  value={formData.spesa_ads}
                  onChange={(e) => setFormData(prev => ({ ...prev, spesa_ads: e.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : 'Salva Dati Amazon'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Revenue List */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Report Mensile Amazon</CardTitle>
          <CardDescription>Visualizza e gestisci i dati mensili Amazon con performance ROI</CardDescription>
        </CardHeader>
        <CardContent>
          {amazonData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun dato Amazon trovato. Aggiungi il primo record per iniziare!</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Mese</TableHead>
                    <TableHead className="text-right">Fatturato</TableHead>
                    <TableHead className="text-right">Spesa Ads</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">Margine</TableHead>
                    <TableHead className="w-[100px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amazonData.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {format(new Date(record.month), 'MMMM yyyy', { locale: it })}
                      </TableCell>
                      <TableCell className="text-right">€{record.fatturato.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{record.spesa_ads.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={record.roi >= 0 ? "default" : "destructive"}
                          className={record.roi >= 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {record.roi.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${(record.fatturato - record.spesa_ads) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{(record.fatturato - record.spesa_ads).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id!)}
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
    </div>
  );
};
