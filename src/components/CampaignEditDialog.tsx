
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CampaignWithProducts } from '@/lib/supabaseService';
import { supabase } from '@/integrations/supabase/client';

interface CampaignEditDialogProps {
  campaign: CampaignWithProducts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const CampaignEditDialog = ({ campaign, open, onOpenChange, onSave }: CampaignEditDialogProps) => {
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    spesa_ads: '',
    fatturato: '',
    ordini: '',
    prodotti: '',
    data: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (campaign) {
      setFormData({
        titolo: campaign.titolo,
        descrizione: campaign.descrizione || '',
        spesa_ads: campaign.budget.toString(),
        fatturato: campaign.fatturato.toString(),
        ordini: campaign.ordini.toString(),
        prodotti: campaign.prodotti.toString(),
        data: campaign.data
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;
    
    const spesa_ads = parseFloat(formData.spesa_ads);
    const fatturato = parseFloat(formData.fatturato);
    const ordini = parseInt(formData.ordini);
    const prodotti = parseInt(formData.prodotti);

    if (spesa_ads < 0 || fatturato < 0 || ordini < 0 || prodotti < 0) {
      toast({
        title: "Valori non validi",
        description: "Tutti i valori devono essere numeri positivi",
        variant: "destructive"
      });
      return;
    }

    const roi = spesa_ads > 0 ? ((fatturato - spesa_ads) / spesa_ads) * 100 : 0;
    const valoreMedioOrdine = ordini > 0 ? fatturato / ordini : 0;
    const prodottiMediPerOrdine = ordini > 0 ? prodotti / ordini : 0;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('campaigns')
        .update({
          titolo: formData.titolo,
          descrizione: formData.descrizione,
          budget: spesa_ads,
          fatturato,
          ordini,
          prodotti,
          data: formData.data,
          roi,
          valore_medio_ordine: valoreMedioOrdine,
          prodotti_medi_per_ordine: prodottiMediPerOrdine
        })
        .eq('id', campaign.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Campagna aggiornata",
        description: `La campagna "${formData.titolo}" è stata aggiornata con successo`
      });
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Errore nell'aggiornamento",
        description: "Impossibile aggiornare la campagna",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Campagna</DialogTitle>
          <DialogDescription>
            Aggiorna i dati della campagna "{campaign.titolo}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titolo">Titolo Campagna</Label>
              <Input
                id="titolo"
                placeholder="es. Campagna Facebook Natale"
                value={formData.titolo}
                onChange={(e) => setFormData(prev => ({ ...prev, titolo: e.target.value }))}
                required
              />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione della Campagna</Label>
            <Textarea
              id="descrizione"
              placeholder="Descrivi la tua campagna pubblicitaria..."
              value={formData.descrizione}
              onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="fatturato">Fatturato Generato (€)</Label>
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
              <Label htmlFor="ordini">Numero di Ordini</Label>
              <Input
                id="ordini"
                type="number"
                min="0"
                placeholder="25"
                value={formData.ordini}
                onChange={(e) => setFormData(prev => ({ ...prev, ordini: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prodotti">Prodotti Venduti</Label>
              <Input
                id="prodotti"
                type="number"
                min="0"
                placeholder="50"
                value={formData.prodotti}
                onChange={(e) => setFormData(prev => ({ ...prev, prodotti: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
