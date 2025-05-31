
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, Plus, Trash2 } from 'lucide-react';

interface ProductMargin {
  id: string;
  nome: string;
  prezzoVendita: number;
  costoSpedizione: number;
  costoProdotto: number;
  commissioniAmazon: number;
  margineNetto: number;
  marginePercentuale: number;
}

export const MarginCalculator = () => {
  const [products, setProducts] = useState<ProductMargin[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    prezzoVendita: '',
    costoSpedizione: '',
    costoProdotto: '',
    commissioniAmazon: ''
  });

  const calculateMargins = (
    prezzoVendita: number,
    costoSpedizione: number,
    costoProdotto: number,
    commissioniAmazon: number
  ) => {
    const totalCosti = costoSpedizione + costoProdotto + commissioniAmazon;
    const margineNetto = prezzoVendita - totalCosti;
    const marginePercentuale = prezzoVendita > 0 ? (margineNetto / prezzoVendita) * 100 : 0;
    
    return { margineNetto, marginePercentuale };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const prezzoVendita = parseFloat(formData.prezzoVendita) || 0;
    const costoSpedizione = parseFloat(formData.costoSpedizione) || 0;
    const costoProdotto = parseFloat(formData.costoProdotto) || 0;
    const commissioniAmazon = parseFloat(formData.commissioniAmazon) || 0;

    const { margineNetto, marginePercentuale } = calculateMargins(
      prezzoVendita,
      costoSpedizione,
      costoProdotto,
      commissioniAmazon
    );

    const newProduct: ProductMargin = {
      id: Date.now().toString(),
      nome: formData.nome || `Prodotto ${products.length + 1}`,
      prezzoVendita,
      costoSpedizione,
      costoProdotto,
      commissioniAmazon,
      margineNetto,
      marginePercentuale
    };

    setProducts([...products, newProduct]);
    
    // Reset form
    setFormData({
      nome: '',
      prezzoVendita: '',
      costoSpedizione: '',
      costoProdotto: '',
      commissioniAmazon: ''
    });
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const avgMarginPercentage = products.length > 0 
    ? products.reduce((sum, p) => sum + p.marginePercentuale, 0) / products.length 
    : 0;

  const totalNetMargin = products.reduce((sum, p) => sum + p.margineNetto, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Margine Netto Totale</CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalNetMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{totalNetMargin.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Margine % Medio</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgMarginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgMarginPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculator Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Calcola Margine Prodotto
          </CardTitle>
          <CardDescription>Inserisci i dati del prodotto per calcolare il margine</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Prodotto</Label>
              <Input
                id="nome"
                placeholder="es. Prodotto XYZ"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prezzoVendita">Prezzo di Vendita (€)</Label>
                <Input
                  id="prezzoVendita"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.99"
                  value={formData.prezzoVendita}
                  onChange={(e) => setFormData(prev => ({ ...prev, prezzoVendita: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costoSpedizione">Costo Spedizione (€)</Label>
                <Input
                  id="costoSpedizione"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3.50"
                  value={formData.costoSpedizione}
                  onChange={(e) => setFormData(prev => ({ ...prev, costoSpedizione: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costoProdotto">Costo Prodotto (Imponibile) (€)</Label>
                <Input
                  id="costoProdotto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.00"
                  value={formData.costoProdotto}
                  onChange={(e) => setFormData(prev => ({ ...prev, costoProdotto: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissioniAmazon">Commissioni Amazon (€) - Opzionale</Label>
                <Input
                  id="commissioniAmazon"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="4.50"
                  value={formData.commissioniAmazon}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissioniAmazon: e.target.value }))}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Calcola Margine
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Risultati Calcoli Margini</CardTitle>
          <CardDescription>Visualizza i margini calcolati per ogni prodotto</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun prodotto calcolato. Aggiungi il primo prodotto per iniziare!</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-right">Prezzo Vendita</TableHead>
                    <TableHead className="text-right">Costi Totali</TableHead>
                    <TableHead className="text-right">Margine Netto</TableHead>
                    <TableHead className="text-right">Margine %</TableHead>
                    <TableHead className="w-[80px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const costiTotali = product.costoSpedizione + product.costoProdotto + product.commissioniAmazon;
                    return (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{product.nome}</TableCell>
                        <TableCell className="text-right">€{product.prezzoVendita.toFixed(2)}</TableCell>
                        <TableCell className="text-right">€{costiTotali.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className={product.margineNetto >= 0 ? 'text-green-600' : 'text-red-600'}>
                            €{product.margineNetto.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={product.marginePercentuale >= 0 ? "default" : "destructive"}
                            className={product.marginePercentuale >= 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {product.marginePercentuale.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
