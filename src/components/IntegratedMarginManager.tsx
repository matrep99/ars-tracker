
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Trash2, Edit, Calculator, TrendingUp, Package } from 'lucide-react';
import { 
  getAllProductCosts, 
  saveProductCosts, 
  deleteProductCost, 
  ProductCostData 
} from '@/lib/productCostService';
import { getAllMonthlyOrders, MonthlyOrderData } from '@/lib/monthlyOrderService';

interface ProductMarginData extends ProductCostData {
  monthly_sales?: {
    pezzi_totali: number;
    imponibile_totale: number;
    month: string;
    total_orders?: number;
  }[];
  total_margin?: number;
  margin_percentage?: number;
  total_revenue?: number;
  total_units?: number;
}

interface MarginReport {
  month: string;
  net_revenue: number;
  product_costs: number;
  packaging_costs: number;
  shipping_costs: number;
  ad_spend: number;
  total_costs: number;
  net_margin: number;
  margin_percentage: number;
  total_orders: number;
}

export const IntegratedMarginManager = () => {
  const [productCosts, setProductCosts] = useState<ProductMarginData[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyOrderData[]>([]);
  const [defaultShippingCost, setDefaultShippingCost] = useState('5.00');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    prodotto: '',
    production_cost: '',
    packaging_cost: '',
    iva_rate: '22',
    has_shipping_cost: true
  });
  const [selectedMonth, setSelectedMonth] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [costsData, ordersData] = await Promise.all([
        getAllProductCosts(),
        getAllMonthlyOrders()
      ]);
      
      setMonthlyOrders(ordersData);
      
      // Enhanced data enrichment with proper margin calculations
      const enrichedCosts = costsData.map(cost => {
        const productSales = ordersData.filter(order => order.prodotto === cost.prodotto);
        const totalImponibile = productSales.reduce((sum, sale) => sum + sale.imponibile_totale, 0);
        const totalUnits = productSales.reduce((sum, sale) => sum + sale.pezzi_totali, 0);
        
        // Calculate total costs
        const totalProductionCost = totalUnits * cost.production_cost;
        const totalPackagingCost = totalUnits * cost.packaging_cost;
        
        // Calculate shipping costs based on orders, not units
        const uniqueMonths = [...new Set(productSales.map(sale => sale.month))];
        const totalShippingCost = cost.has_shipping_cost ? 
          uniqueMonths.reduce((sum, month) => {
            const monthSales = productSales.filter(sale => sale.month === month);
            const ordersForMonth = monthSales[0]?.total_orders || 0;
            return sum + (ordersForMonth * parseFloat(defaultShippingCost));
          }, 0) : 0;
        
        const totalCosts = totalProductionCost + totalPackagingCost + totalShippingCost;
        const totalMargin = totalImponibile - totalCosts;
        const marginPercentage = totalImponibile > 0 ? (totalMargin / totalImponibile) * 100 : 0;
        
        return {
          ...cost,
          monthly_sales: productSales.map(sale => ({
            pezzi_totali: sale.pezzi_totali,
            imponibile_totale: sale.imponibile_totale,
            month: sale.month,
            total_orders: sale.total_orders
          })),
          total_margin: totalMargin,
          margin_percentage: marginPercentage,
          total_revenue: totalImponibile,
          total_units: totalUnits
        };
      });
      
      setProductCosts(enrichedCosts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Impossibile caricare i dati",
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
      await loadData();
      
      setFormData({
        prodotto: '',
        production_cost: '',
        packaging_cost: '',
        iva_rate: '22',
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

  const handleEdit = (product: ProductMarginData) => {
    setFormData({
      prodotto: product.prodotto,
      production_cost: product.production_cost.toString(),
      packaging_cost: product.packaging_cost.toString(),
      iva_rate: '22',
      has_shipping_cost: product.has_shipping_cost
    });
    setEditingId(product.id!);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteProductCost(id);
      await loadData();
      
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
      iva_rate: '22',
      has_shipping_cost: true
    });
    setEditingId(null);
  };

  // Generate margin reports by month
  const generateMarginReports = (): MarginReport[] => {
    const monthlyData = new Map<string, MarginReport>();
    
    // Initialize months from orders
    monthlyOrders.forEach(order => {
      if (!monthlyData.has(order.month)) {
        monthlyData.set(order.month, {
          month: order.month,
          net_revenue: 0,
          product_costs: 0,
          packaging_costs: 0,
          shipping_costs: 0,
          ad_spend: 0,
          total_costs: 0,
          net_margin: 0,
          margin_percentage: 0,
          total_orders: order.total_orders || 0
        });
      }
      
      const report = monthlyData.get(order.month)!;
      report.net_revenue += order.imponibile_totale;
      
      // Find product costs
      const productCost = productCosts.find(pc => pc.prodotto === order.prodotto);
      if (productCost) {
        report.product_costs += order.pezzi_totali * productCost.production_cost;
        report.packaging_costs += order.pezzi_totali * productCost.packaging_cost;
        
        if (productCost.has_shipping_cost) {
          report.shipping_costs += (order.total_orders || 0) * parseFloat(defaultShippingCost);
        }
      }
    });
    
    // Calculate final margins
    return Array.from(monthlyData.values()).map(report => {
      report.total_costs = report.product_costs + report.packaging_costs + report.shipping_costs + report.ad_spend;
      report.net_margin = report.net_revenue - report.total_costs;
      report.margin_percentage = report.net_revenue > 0 ? (report.net_margin / report.net_revenue) * 100 : 0;
      return report;
    }).sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
  };

  const marginReports = generateMarginReports();
  const totalNetRevenue = marginReports.reduce((sum, report) => sum + report.net_revenue, 0);
  const totalMargin = marginReports.reduce((sum, report) => sum + report.net_margin, 0);
  const overallMarginPercentage = totalNetRevenue > 0 ? (totalMargin / totalNetRevenue) * 100 : 0;

  // Get unique months for filter
  const uniqueMonths = [...new Set(monthlyOrders.map(order => order.month))].sort().reverse();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-blue-600">Fatturato Netto Totale</div>
            <div className="text-2xl font-bold text-blue-900">€{totalNetRevenue.toFixed(2)}</div>
            <div className="text-xs text-blue-700 mt-1">Imponibile (IVA esclusa)</div>
          </CardContent>
        </Card>

        <Card className={`${totalMargin >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <CardContent className="pt-4">
            <div className={`text-sm font-medium ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Margine Netto Totale
            </div>
            <div className={`text-2xl font-bold ${totalMargin >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              €{totalMargin.toFixed(2)}
            </div>
            <div className={`text-xs mt-1 ${totalMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {overallMarginPercentage.toFixed(1)}% del fatturato netto
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-600">Costo Spedizione Default</div>
            <div className="text-2xl font-bold text-gray-900">€{defaultShippingCost}</div>
            <Input
              type="number"
              step="0.01"
              value={defaultShippingCost}
              onChange={(e) => setDefaultShippingCost(e.target.value)}
              className="mt-2 text-sm"
              placeholder="5.00"
            />
          </CardContent>
        </Card>
      </div>

      {/* Product Cost Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestione Costi Prodotti
          </CardTitle>
          <CardDescription>
            Configura i costi di produzione, packaging e shipping per calcolare i margini reali
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
                <Label htmlFor="production_cost">Costo Produzione Unitario (€)</Label>
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
                <Label htmlFor="packaging_cost">Costo Packaging Unitario (€)</Label>
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

      {/* Monthly Margin Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Report Margini Mensili
          </CardTitle>
          <CardDescription>Analisi dettagliata dei margini per mese</CardDescription>
        </CardHeader>
        <CardContent>
          {marginReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessun dato disponibile. Carica prima i dati delle vendite.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Mese</TableHead>
                    <TableHead className="text-right">Fatturato Netto</TableHead>
                    <TableHead className="text-right">Costi Produzione</TableHead>
                    <TableHead className="text-right">Costi Packaging</TableHead>
                    <TableHead className="text-right">Costi Spedizione</TableHead>
                    <TableHead className="text-right">Ordini Totali</TableHead>
                    <TableHead className="text-right">Margine Netto</TableHead>
                    <TableHead className="text-right">Margine %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marginReports.map((report) => (
                    <TableRow key={report.month}>
                      <TableCell className="font-medium">
                        {new Date(report.month).toLocaleDateString('it-IT', { year: 'numeric', month: 'long' })}
                      </TableCell>
                      <TableCell className="text-right">€{report.net_revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{report.product_costs.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{report.packaging_costs.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{report.shipping_costs.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{report.total_orders}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${report.net_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{report.net_margin.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={report.margin_percentage >= 0 ? "default" : "destructive"}
                          className={report.margin_percentage >= 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {report.margin_percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Margin Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Margini per Prodotto
          </CardTitle>
          <CardDescription>Analisi dettagliata dei margini per ogni prodotto</CardDescription>
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
                    <TableHead className="text-right">Unità Vendute</TableHead>
                    <TableHead className="text-right">Fatturato Netto</TableHead>
                    <TableHead className="text-right">Costi Totali</TableHead>
                    <TableHead className="text-right">Margine Netto</TableHead>
                    <TableHead className="text-right">Margine %</TableHead>
                    <TableHead className="text-center">Spedizione</TableHead>
                    <TableHead className="w-[120px]">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCosts.map((product) => {
                    const totalUnits = product.total_units || 0;
                    const totalRevenue = product.total_revenue || 0;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.prodotto}</TableCell>
                        <TableCell className="text-right">{totalUnits}</TableCell>
                        <TableCell className="text-right">€{totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          €{((totalUnits * product.production_cost) + (totalUnits * product.packaging_cost)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${(product.total_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            €{(product.total_margin || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={(product.margin_percentage || 0) >= 0 ? "default" : "destructive"}
                            className={(product.margin_percentage || 0) >= 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {(product.margin_percentage || 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {product.has_shipping_cost ? '✓' : '✗'}
                        </TableCell>
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
