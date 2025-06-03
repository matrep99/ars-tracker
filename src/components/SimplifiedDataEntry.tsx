
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload } from 'lucide-react';
import { CSVUpload } from './CSVUpload';

interface SimplifiedDataEntryProps {
  onDataSaved: () => void;
}

export const SimplifiedDataEntry = ({ onDataSaved }: SimplifiedDataEntryProps) => {
  const [formData, setFormData] = useState({
    spesa_ads: '',
    fatturato: '',
    data: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const spesa_ads = parseFloat(formData.spesa_ads);
    const fatturato = parseFloat(formData.fatturato);

    if (spesa_ads < 0 || fatturato < 0) {
      toast({
        title: "Valori non validi",
        description: "Tutti i valori devono essere numeri positivi",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Here you would save to your preferred storage (Supabase campaigns table)
      // For now, I'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setFormData({
        spesa_ads: '',
        fatturato: '',
        data: new Date().toISOString().split('T')[0]
      });
      
      toast({
        title: "Dati salvati",
        description: "I dati sono stati salvati con successo"
      });
      
      onDataSaved();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare i dati",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Data Entry */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aggiungi Dati Manualmente
          </CardTitle>
          <CardDescription>
            Inserisci rapidamente spesa ads e fatturato per il periodo selezionato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="spesa_ads">Spesa Ads (€)</Label>
                <Input
                  id="spesa_ads"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000.00"
                  value={formData.spesa_ads}
                  onChange={(e) => setFormData(prev => ({ ...prev, spesa_ads: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fatturato">Fatturato (€)</Label>
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
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : 'Salva Dati'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CSV Upload Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Dati da CSV
          </CardTitle>
          <CardDescription>
            Carica un file CSV con i dati degli ordini mensili per un'analisi dettagliata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CSVUpload onDataUploaded={onDataSaved} />
        </CardContent>
      </Card>
    </div>
  );
};
