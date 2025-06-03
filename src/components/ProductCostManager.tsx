
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import { 
  getAllProductCosts, 
  saveProductCosts, 
  deleteProductCost, 
  ProductCostData 
} from '@/lib/productCostService';

export const ProductCostManager = () => {
  const [productCosts, setProductCosts] = useState<ProductCostData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    prodotto: '',
    production_cost: '',
    packaging_cost: '',
    has_shipping_cost: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProductCosts();
  }, []);

  const loadProductCosts = async () => {
    try {
      setIsLoading(true);
      const data = await getAllProductCosts();
      setProductCosts(data);
    } catch (error) {
      console.error('Error loading product costs:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare i costi prodotti",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prodotto.trim()) {
      toast({
        title: "Nome prodotto richiesto",
        description: "Inserisci il nome del prodotto",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const productCostData = {
        prodotto: formData.prodotto.trim(),
        production_cost: parseFloat(formData.production_cost) || 0,
        packaging_cost: parseFloat(formData.packaging_cost) || 0,
        has_shipping_cost: formData.has_shipping_cost
      };

      await saveProductCosts([productCostData]);
      await loadProductCosts();
      
      setFormData({
        prodotto: '',
        production_cost: '',
        packaging_cost: '',
        has_shipping_cost: true
      });
      setEditingId(null);
      
      toast({
        title: "Costi salvati",
        description: `Costi salvati per ${productCostData.prodotto}`
      });
    } catch (error) {
      console.error('Error saving product costs:', error);
      toast({
        title: "Errore nel salvataggio",
        description: "Impossibile salvare i costi prodotto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: ProductCostData) => {
    setFormData({
      prodotto: product.prodotto,
      production_cost: product.production_cost.toString(),
      packaging_cost: product.packaging_cost.toString(),
      has_shipping_cost: product.has_shipping_cost
    });
    setEditingId(product.id!);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteProductCost(id);
      await loadProductCosts();
      
      toast({
        title: "Prodotto eliminato",
        description: "Costi prodotto eliminati con successo"
      });
    } catch (error) {
      console.error('Error deleting product cost:', error);
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare i costi prodotto",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      prodotto: '',
      production_cost: '',
      packaging_cost: '',
      has_shipping_cost: true
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestione Costi Prodotti
          </CardTitle>
          <CardDescription>
            Configura i costi di produzione e confezionamento per ogni prodotto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodotto">Nome Prodotto</Label>
                <Input
                  id="prodotto"
                  placeholder="es. Prodotto XYZ"
                  value={formData.prodotto}
                  onChange={(e) => setFormData(prev => ({ ...prev, prodotto: e.target.value }))}
                  required
                  disabled={editingId !== null}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="production_cost">Costo Produzione (€)</Label>
                <Input
                  id="production_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10.00"
                  value={formData.production_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, production_cost: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="packaging_cost">Costo Confezionamento (€)</Label>
                <Input
                  id="packaging_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2.50"
                  value={formData.packaging_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, packaging_cost: e.target.value }))}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="has_shipping_cost"
                  checked={formData.has_shipping_cost}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_shipping_cost: checked as boolean }))}
                />
                <Label htmlFor="has_shipping_cost">Include costi spedizione</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? 'Aggiorna Costi' : 'Aggiungi Costi'}
              </Button>
              
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={cancelEdit}
                >
                  Annulla
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costi Prodotti Configurati</CardTitle>
          <CardDescription>Lista dei prodotti con costi configurati</CardDescription>
        </CardHeader>
        <CardContent>
          {productCosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun costo prodotto configurato. Aggiungi il primo!</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-right">Costo Produzione</TableHead>
                    <TableHead className="text-right">Costo Confez.</TableHead>
                    <TableHead className="text-center">Spedizione</TableHead>
                    <TableHead className="text-right">Costo Totale</TableHead>
                    <TableHead className="w-[120px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCosts.map((product) => {
                    const totalCost = product.production_cost + product.packaging_cost;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.prodotto}</TableCell>
                        <TableCell className="text-right">€{product.production_cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">€{product.packaging_cost.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          {product.has_shipping_cost ? '✓' : '✗'}
                        </TableCell>
                        <TableCell className="text-right">€{totalCost.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id!)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
