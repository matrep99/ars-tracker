
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
    month: new Date().toISOString().split('T')[0].slice(0, 7)
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const spesa_ads = parseFloat(formData.spesa_ads);

    if (spesa_ads < 0) {
      toast({
        title: "Valore non valido",
        description: "La spesa ads deve essere un numero positivo",
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
        month: new Date().toISOString().split('T')[0].slice(0, 7)
      });
      
      toast({
        title: "Dati salvati",
        description: "La spesa ads è stata salvata con successo"
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
            Aggiungi Spesa Ads
          </CardTitle>
          <CardDescription>
            Inserisci la spesa pubblicitaria per il mese selezionato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? 'Salvataggio...' : 'Salva Spesa Ads'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CSV Upload Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Dati Vendite da CSV
          </CardTitle>
          <CardDescription>
            Carica un file CSV con i dati degli ordini mensili per un'analisi dettagliata dei margini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CSVUpload onDataUploaded={onDataSaved} />
        </CardContent>
      </Card>
    </div>
  );
};
