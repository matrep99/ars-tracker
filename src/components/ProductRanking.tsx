
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { getAllMonthlyOrders, MonthlyOrderData } from '@/lib/monthlyOrderService';

export const ProductRanking = () => {
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'total' | 'monthly'>('total');

  useEffect(() => {
    loadMonthlyOrders();
  }, []);

  const loadMonthlyOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMonthlyOrders();
      setMonthlyOrders(data);
    } catch (error) {
      console.error('Error loading monthly orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateProducts = () => {
    const productMap = new Map<string, number>();
    
    monthlyOrders.forEach(order => {
      const current = productMap.get(order.prodotto) || 0;
      productMap.set(order.prodotto, current + order.pezzi_totali);
    });

    return Array.from(productMap.entries())
      .map(([nome, quantita]) => ({ nome, quantita }))
      .sort((a, b) => b.quantita - a.quantita)
      .slice(0, 10);
  };

  const getMonthlyBreakdown = () => {
    const monthlyData = new Map<string, Map<string, number>>();
    
    monthlyOrders.forEach(order => {
      const monthKey = format(parseISO(order.month), 'MMM yyyy', { locale: it });
      
      if (!monthlyData.has(order.prodotto)) {
        monthlyData.set(order.prodotto, new Map());
      }
      
      const productMonths = monthlyData.get(order.prodotto)!;
      const currentQuantity = productMonths.get(monthKey) || 0;
      productMonths.set(monthKey, currentQuantity + order.pezzi_totali);
    });

    // Get all unique months
    const allMonths = new Set<string>();
    monthlyOrders.forEach(order => {
      const monthKey = format(parseISO(order.month), 'MMM yyyy', { locale: it });
      allMonths.add(monthKey);
    });

    // Convert to chart data format
    const chartData: any[] = [];
    Array.from(allMonths).sort().forEach(month => {
      const monthData: any = { month };
      let totalForMonth = 0;
      
      monthlyData.forEach((months, product) => {
        const quantity = months.get(month) || 0;
        monthData[product] = quantity;
        totalForMonth += quantity;
      });
      
      if (totalForMonth > 0) {
        chartData.push(monthData);
      }
    });

    return chartData;
  };

  const getTopProductsWithMonthlyTotals = () => {
    const productTotals = new Map<string, { total: number; monthlyData: Map<string, number> }>();
    
    monthlyOrders.forEach(order => {
      const monthKey = format(parseISO(order.month), 'MMM yyyy', { locale: it });
      
      if (!productTotals.has(order.prodotto)) {
        productTotals.set(order.prodotto, { total: 0, monthlyData: new Map() });
      }
      
      const productData = productTotals.get(order.prodotto)!;
      productData.total += order.pezzi_totali;
      
      const currentMonthly = productData.monthlyData.get(monthKey) || 0;
      productData.monthlyData.set(monthKey, currentMonthly + order.pezzi_totali);
    });

    return Array.from(productTotals.entries())
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const topProducts = aggregateProducts();
  const monthlyBreakdown = getMonthlyBreakdown();
  const topProductsWithMonthly = getTopProductsWithMonthlyTotals();

  // Get unique months for display
  const uniqueMonths = Array.from(new Set(monthlyOrders.map(order => 
    format(parseISO(order.month), 'MMM yyyy', { locale: it })
  ))).sort();

  // Generate colors for different products
  const getProductColor = (index: number) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti Più Venduti</CardTitle>
          <CardDescription>Caricamento dati...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (topProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti Più Venduti</CardTitle>
          <CardDescription>Carica dati CSV per visualizzare la classifica</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Nessun prodotto trovato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Classifica Prodotti Più Venduti</CardTitle>
          <CardDescription>
            {viewMode === 'total' 
              ? 'I 10 prodotti con il maggior numero di vendite totali'
              : 'Andamento vendite mensili dei prodotti più venduti'
            }
          </CardDescription>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'total' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('total')}
            >
              Vista Totali
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              Vista Mensile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'total' ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Quantità Venduta']}
                    labelFormatter={(label) => `Prodotto: ${label}`}
                  />
                  <Bar dataKey="quantita" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>

              {/* Detailed breakdown table */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Dettaglio Vendite per Mese</h4>
                <div className="space-y-3">
                  {topProductsWithMonthly.map((product, index) => (
                    <div key={product.nome} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900">{product.nome}</h5>
                        <Badge variant="secondary">
                          Totale: {product.total} unità
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
                        {uniqueMonths.map(month => {
                          const quantity = product.monthlyData.get(month) || 0;
                          return (
                            <div key={month} className="flex justify-between bg-white p-2 rounded">
                              <span className="text-gray-600">{month}:</span>
                              <span className="font-medium">{quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                {topProducts.slice(0, 5).map((product, index) => (
                  <Line
                    key={product.nome}
                    type="monotone"
                    dataKey={product.nome}
                    stroke={getProductColor(index)}
                    strokeWidth={2}
                    dot={{ fill: getProductColor(index), strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
