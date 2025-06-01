
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { getAllCampaignsFromSupabase, CampaignWithProducts } from '@/lib/supabaseService';
import { getAllAmazonRevenue, AmazonRevenueData } from '@/lib/amazonRevenueService';
import type { DateRange } from './DateFilter';

interface ProductMargin {
  id: string;
  nome: string;
  prezzo_vendita: number;
  costo_spedizione: number;
  costo_prodotto: number;
  commissioni_amazon: number;
  margine_netto_unitario: number;
  margine_percentuale: number;
  quantita_campagne: number;
  quantita_amazon: number;
  quantita_totale: number;
  margine_totale: number;
}

interface IntegratedMarginCalculatorProps {
  totalCampaignSpend?: number;
  totalAmazonSpend?: number;
  dateRange?: DateRange;
}

export const IntegratedMarginCalculator = ({ 
  totalCampaignSpend = 0, 
  totalAmazonSpend = 0,
  dateRange 
}: IntegratedMarginCalculatorProps) => {
  const [productMargins, setProductMargins] = useState<ProductMargin[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignWithProducts[]>([]);
  const [amazonData, setAmazonData] = useState<AmazonRevenueData[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    prezzo_vendita: '',
    costo_spedizione: '',
    costo_prodotto: '',
    commissioni_amazon: ''
  });
  const [otherExpenses, setOtherExpenses] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSalesData();
  }, [dateRange]);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      const [campaigns, amazon] = await Promise.all([
        getAllCampaignsFromSupabase(),
        getAllAmazonRevenue()
      ]);
      
      setCampaignData(campaigns);
      setAmazonData(amazon);
      updateProductQuantities(campaigns, amazon);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProductQuantities = (campaigns: CampaignWithProducts[], amazon: AmazonRevenueData[]) => {
    setProductMargins(prevMargins => 
      prevMargins.map(margin => {
        // Calculate quantities from campaigns
        const quantitaCampagne = campaigns.reduce((sum, campaign) => {
          const product = campaign.campaign_products?.find(p => 
            p.nome.toLowerCase() === margin.nome.toLowerCase()
          );
          return sum + (product?.quantita || 0);
        }, 0);

        // Calculate quantities from Amazon
        const quantitaAmazon = amazon.reduce((sum, record) => {
          const product = record.amazon_products?.find(p => 
            p.nome.toLowerCase() === margin.nome.toLowerCase()
          );
          return sum + (product?.quantita || 0);
        }, 0);

        const quantitaTotale = quantitaCampagne + quantitaAmazon;
        const margineTotale = margin.margine_netto_unitario * quantitaTotale;

        return {
          ...margin,
          quantita_campagne: quantitaCampagne,
          quantita_amazon: quantitaAmazon,
          quantita_totale: quantitaTotale,
          margine_totale: margineTotale
        };
      })
    );
  };

  const calculateProductMargin = (
    prezzo_vendita: number,
    costo_spedizione: number,
    costo_prodotto: number,
    commissioni_amazon: number
  ) => {
    const totalCosts = costo_spedizione + costo_prodotto + commissioni_amazon;
    const margine_netto = prezzo_vendita - totalCosts;
    const margine_percentuale = prezzo_vendita > 0 ? (margine_netto / prezzo_vendita) * 100 : 0;
    
    return { margine_netto, margine_percentuale };
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const prezzo_vendita = parseFloat(formData.prezzo_vendita);
    const costo_spedizione = parseFloat(formData.costo_spedizione);
    const costo_prodotto = parseFloat(formData.costo_prodotto);
    const commissioni_amazon = parseFloat(formData.commissioni_amazon) || 0;

    if (prezzo_vendita <= 0 || costo_spedizione < 0 || costo_prodotto < 0 || commissioni_amazon < 0) {
      return;
    }

    const { margine_netto, margine_percentuale } = calculateProductMargin(
      prezzo_vendita,
      costo_spedizione,
      costo_prodotto,
      commissioni_amazon
    );

    // Calculate quantities from existing sales data
    const quantitaCampagne = campaignData.reduce((sum, campaign) => {
      const product = campaign.campaign_products?.find(p => 
        p.nome.toLowerCase() === formData.nome.toLowerCase()
      );
      return sum + (product?.quantita || 0);
    }, 0);

    const quantitaAmazon = amazonData.reduce((sum, record) => {
      const product = record.amazon_products?.find(p => 
        p.nome.toLowerCase() === formData.nome.toLowerCase()
      );
      return sum + (product?.quantita || 0);
    }, 0);

    const quantitaTotale = quantitaCampagne + quantitaAmazon;

    const newProduct: ProductMargin = {
      id: Date.now().toString(),
      nome: formData.nome,
      prezzo_vendita,
      costo_spedizione,
      costo_prodotto,
      commissioni_amazon,
      margine_netto_unitario: margine_netto,
      margine_percentuale,
      quantita_campagne: quantitaCampagne,
      quantita_amazon: quantitaAmazon,
      quantita_totale: quantitaTotale,
      margine_totale: margine_netto * quantitaTotale
    };

    setProductMargins([...productMargins, newProduct]);
    setFormData({
      nome: '',
      prezzo_vendita: '',
      costo_spedizione: '',
      costo_prodotto: '',
      commissioni_amazon: ''
    });
  };

  const removeProduct = (id: string) => {
    setProductMargins(productMargins.filter(p => p.id !== id));
  };

  // Calculate totals
  const totalRevenue = productMargins.reduce((sum, p) => sum + (p.prezzo_vendita * p.quantita_totale), 0);
  const totalProductMargin = productMargins.reduce((sum, p) => sum + p.margine_totale, 0);
  const totalAdvertisingSpend = totalCampaignSpend + totalAmazonSpend;
  const otherExp = parseFloat(otherExpenses) || 0;
  const netProfit = totalProductMargin - totalAdvertisingSpend - otherExp;
  const netProfitPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Calculate products without cost data
  const allProductNames = new Set([
    ...campaignData.flatMap(c => c.campaign_products?.map(p => p.nome.toLowerCase()) || []),
    ...amazonData.flatMap(a => a.amazon_products?.map(p => p.nome.toLowerCase()) || [])
  ]);

  const productsWithCostData = new Set(productMargins.map(p => p.nome.toLowerCase()));
  const productsWithoutCostData = Array.from(allProductNames).filter(name => 
    !productsWithCostData.has(name)
  );

  return (
    <div className="space-y-6">
      {/* Add Product Form */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aggiungi Costi Prodotto
          </CardTitle>
          <CardDescription>
            Inserisci i costi per calcolare i margini. I dati di vendita vengono automaticamente recuperati dalle campagne e da Amazon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Prodotto</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="es. iPhone 15"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prezzo_vendita">Prezzo di Vendita (€)</Label>
                <Input
                  id="prezzo_vendita"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prezzo_vendita}
                  onChange={(e) => setFormData(prev => ({ ...prev, prezzo_vendita: e.target.value }))}
                  placeholder="100.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo_spedizione">Costo Spedizione (€)</Label>
                <Input
                  id="costo_spedizione"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costo_spedizione}
                  onChange={(e) => setFormData(prev => ({ ...prev, costo_spedizione: e.target.value }))}
                  placeholder="5.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo_prodotto">Costo Prodotto (€)</Label>
                <Input
                  id="costo_prodotto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costo_prodotto}
                  onChange={(e) => setFormData(prev => ({ ...prev, costo_prodotto: e.target.value }))}
                  placeholder="50.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissioni_amazon">Commissioni Amazon (€)</Label>
                <Input
                  id="commissioni_amazon"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.commissioni_amazon}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissioni_amazon: e.target.value }))}
                  placeholder="10.00"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              Aggiungi Prodotto
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products without cost data warning */}
      {productsWithoutCostData.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Prodotti Senza Dati di Costo
            </CardTitle>
            <CardDescription className="text-yellow-700">
              I seguenti prodotti sono stati venduti ma non hanno dati di costo inseriti:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {productsWithoutCostData.map((productName, index) => (
                <Badge key={index} variant="outline" className="text-yellow-800 border-yellow-300">
                  {productName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      {productMargins.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Analisi Margini Integrata</CardTitle>
            <CardDescription>Margini calcolati con dati di vendita reali da campagne e Amazon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-right">Prezzo Unit.</TableHead>
                    <TableHead className="text-right">Margine Unit.</TableHead>
                    <TableHead className="text-right">Qtà Campagne</TableHead>
                    <TableHead className="text-right">Qtà Amazon</TableHead>
                    <TableHead className="text-right">Qtà Totale</TableHead>
                    <TableHead className="text-right">Margine Totale</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productMargins.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{product.nome}</TableCell>
                      <TableCell className="text-right">€{product.prezzo_vendita.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${product.margine_netto_unitario >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{product.margine_netto_unitario.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{product.quantita_campagne}</TableCell>
                      <TableCell className="text-right">{product.quantita_amazon}</TableCell>
                      <TableCell className="text-right font-medium">{product.quantita_totale}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${product.margine_totale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{product.margine_totale.toFixed(2)}
                        </span>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Margin Calculation */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcolo Utile Finale Integrato
          </CardTitle>
          <CardDescription>Calcolo basato su vendite reali e costi prodotti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="other_expenses">Altre Spese (€)</Label>
              <Input
                id="other_expenses"
                type="number"
                step="0.01"
                min="0"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-blue-600">Ricavi Totali</div>
                <div className="text-2xl font-bold text-blue-900">€{totalRevenue.toFixed(2)}</div>
                <div className="text-xs text-blue-700 mt-1">Da vendite reali</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-green-600">Margine Prodotti</div>
                <div className="text-2xl font-bold text-green-900">€{totalProductMargin.toFixed(2)}</div>
                <div className="text-xs text-green-700 mt-1">Qtà × Margine unitario</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-red-600">Spesa Pubblicità</div>
                <div className="text-2xl font-bold text-red-900">€{totalAdvertisingSpend.toFixed(2)}</div>
                <div className="text-xs text-red-700 mt-1">
                  Campagne: €{totalCampaignSpend.toFixed(2)} | Amazon: €{totalAmazonSpend.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className={`${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Utile Netto Finale
                </div>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  €{netProfit.toFixed(2)}
                </div>
                <div className={`text-xs mt-1 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {netProfitPercentage.toFixed(1)}% sui ricavi
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Riepilogo Calcolo Integrato:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Ricavi totali (da vendite reali): €{totalRevenue.toFixed(2)}</div>
              <div>• Margine lordo prodotti: €{totalProductMargin.toFixed(2)}</div>
              <div>• Spesa pubblicità totale: €{totalAdvertisingSpend.toFixed(2)}</div>
              {otherExp > 0 && <div>• Altre spese: €{otherExp.toFixed(2)}</div>}
              <div className="border-t pt-1 font-medium">
                • <strong>Utile netto finale: €{netProfit.toFixed(2)} ({netProfitPercentage.toFixed(1)}%)</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
