
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Euro, Target } from 'lucide-react';
import { getAllAmazonRevenue, getAmazonRevenueByDateRange } from '@/lib/amazonRevenueService';
import { DateRange } from '@/pages/Index';

interface AmazonRevenueProps {
  dateRange: DateRange;
}

export const AmazonRevenue = ({ dateRange }: AmazonRevenueProps) => {
  const [amazonData, setAmazonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'products'>('overview');

  useEffect(() => {
    loadAmazonData();
  }, [dateRange]);

  const loadAmazonData = async () => {
    try {
      setIsLoading(true);
      let data;
      if (dateRange.type !== 'all' && dateRange.startDate && dateRange.endDate) {
        data = await getAmazonRevenueByDateRange(dateRange.startDate, dateRange.endDate);
      } else {
        data = await getAllAmazonRevenue();
      }
      setAmazonData(data);
    } catch (error) {
      console.error('Error loading Amazon data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatChartData = () => {
    return amazonData.map(item => ({
      month: format(parseISO(item.month), 'MMM yyyy', { locale: it }),
      fatturato: item.fatturato,
      spesa_ads: item.spesa_ads,
      roi: item.roi
    }));
  };

  const aggregateProductData = () => {
    const productMap = new Map<string, { quantita: number; fatturato: number }>();
    
    amazonData.forEach(monthData => {
      if (monthData.amazon_products) {
        monthData.amazon_products.forEach((product: any) => {
          const current = productMap.get(product.nome) || { quantita: 0, fatturato: 0 };
          productMap.set(product.nome, {
            quantita: current.quantita + product.quantita,
            fatturato: current.fatturato + (product.fatturato_prodotto || 0)
          });
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.quantita - a.quantita);
  };

  const getProductMonthlyBreakdown = () => {
    const monthlyData = new Map<string, Map<string, { quantita: number; fatturato: number }>>();
    
    amazonData.forEach(monthData => {
      const monthKey = format(parseISO(monthData.month), 'MMM yyyy', { locale: it });
      
      if (monthData.amazon_products) {
        monthData.amazon_products.forEach((product: any) => {
          if (!monthlyData.has(product.nome)) {
            monthlyData.set(product.nome, new Map());
          }
          
          const productMonths = monthlyData.get(product.nome)!;
          const current = productMonths.get(monthKey) || { quantita: 0, fatturato: 0 };
          productMonths.set(monthKey, {
            quantita: current.quantita + product.quantita,
            fatturato: current.fatturato + (product.fatturato_prodotto || 0)
          });
        });
      }
    });

    return monthlyData;
  };

  const chartData = formatChartData();
  const productData = aggregateProductData();
  const productMonthlyData = getProductMonthlyBreakdown();
  
  const totalRevenue = amazonData.reduce((sum, item) => sum + item.fatturato, 0);
  const totalSpent = amazonData.reduce((sum, item) => sum + item.spesa_ads, 0);
  const avgROI = amazonData.length > 0 ? amazonData.reduce((sum, item) => sum + item.roi, 0) / amazonData.length : 0;
  const totalProducts = productData.reduce((sum, product) => sum + product.quantita, 0);

  // Get unique months for product breakdown display
  const uniqueMonths = Array.from(new Set(amazonData.map(item => 
    format(parseISO(item.month), 'MMM yyyy', { locale: it })
  ))).sort();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dati Amazon</CardTitle>
          <CardDescription>Caricamento dati...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (amazonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dati Amazon</CardTitle>
          <CardDescription>Carica dati CSV per visualizzare le performance di Amazon</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Nessun dato Amazon trovato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato Totale</CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spesa Ads Totale</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgROI.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prodotti Venduti</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Amazon</CardTitle>
          <CardDescription>
            {viewMode === 'overview' 
              ? 'Analisi delle performance di vendita e spesa pubblicitaria su Amazon'
              : 'Dettaglio vendite per prodotto su Amazon'
            }
          </CardDescription>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overview')}
            >
              Overview
            </Button>
            <Button
              variant={viewMode === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('products')}
            >
              Prodotti
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'overview' ? (
            <div className="space-y-6">
              {/* Sales Performance Chart */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Performance Vendite nel Tempo</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `€${value.toLocaleString()}`,
                        name === 'fatturato' ? 'Fatturato' : 'Spesa Ads'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="fatturato" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Advertising Spend Chart */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Spesa Pubblicitaria nel Tempo</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString()}`, 'Spesa Ads']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spesa_ads" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ROI Chart */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Andamento ROI</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                    />
                    <Bar dataKey="roi" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Performance Summary */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Performance Prodotti Amazon</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={productData.slice(0, 10)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="nome" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'quantita' ? value : `€${value.toLocaleString()}`,
                        name === 'quantita' ? 'Unità Vendute' : 'Fatturato'
                      ]}
                      labelFormatter={(label) => `Prodotto: ${label}`}
                    />
                    <Bar dataKey="quantita" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Product Breakdown */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Dettaglio Vendite Amazon per Prodotto</h4>
                <div className="space-y-3">
                  {productData.slice(0, 10).map((product, index) => {
                    const monthlyBreakdown = productMonthlyData.get(product.nome);
                    return (
                      <div key={product.nome} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900">{product.nome}</h5>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {product.quantita} unità
                            </Badge>
                            <Badge variant="outline">
                              €{product.fatturato.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
                          {uniqueMonths.map(month => {
                            const monthData = monthlyBreakdown?.get(month) || { quantita: 0, fatturato: 0 };
                            return (
                              <div key={month} className="bg-white p-2 rounded">
                                <div className="text-gray-600 text-xs">{month}</div>
                                <div className="font-medium">{monthData.quantita} unità</div>
                                <div className="text-green-600 text-xs">€{monthData.fatturato.toLocaleString()}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
